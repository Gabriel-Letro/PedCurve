import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Copy, Check, Archive, ArchiveRestore, Trash2,
  AlertTriangle, TrendingUp, CalendarDays, FolderOpen, CheckCircle,
  XCircle, Eye, EyeOff, ChevronUp, ChevronDown, Minus, Bell, Clock,
} from 'lucide-react';
import { differenceInMonths, parseISO } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { calculateAllZScores } from '../utils/zscore';
import { getNextConsultInfo } from '../utils/consultationSchedule';
import type { Patient, Consultation } from '../context/AppContext';

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

type SortKey = 'name' | 'lastConsult' | 'age';
type SortDir = 'asc' | 'desc';
type ClinicalStatus = 'normal' | 'warning' | 'danger' | null;

// ── Module-level helpers ──────────────────────────────────────
const getLastConsultation = (consultations: Consultation[]) => {
  if (consultations.length === 0) return null;
  return [...consultations].sort((a, b) => b.date.localeCompare(a.date))[0];
};

const calculateAge = (birthDateString: string) => {
  const today = new Date();
  const birth = new Date(birthDateString);
  if (Number.isNaN(birth.getTime()) || birth.getTime() > today.getTime()) return 'Data inválida';
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years === 0) return months <= 0 ? 'Recém-nascido' : `${months}m`;
  if (months === 0) return `${years}a`;
  return `${years}a ${months}m`;
};

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const computeStatus = (p: Patient): ClinicalStatus => {
  const last = getLastConsultation(p.consultations);
  if (!last) return null;
  const months = differenceInMonths(parseISO(last.date), parseISO(p.birthDate));
  const zs = calculateAllZScores(p.gender, months, last.weight, last.height, last.headCirc);
  const vals = [zs.weight, zs.height, zs.bmi, zs.headCirc];
  if (vals.some((z) => z.status === 'danger')) return 'danger';
  if (vals.some((z) => z.status === 'warning')) return 'warning';
  if (vals.some((z) => z.value !== null)) return 'normal';
  return null;
};

// ── Dashboard ─────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patients, archivePatient, restorePatient, deletePatient } = useAppContext();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [alertExpanded, setAlertExpanded] = useState(true);

  const isActive = (p: { status?: string }) => (p.status ?? 'active') === 'active';

  const activeCount    = useMemo(() => patients.filter(isActive).length, [patients]);
  const archivedCount  = patients.length - activeCount;

  const thisMonth = new Date().getMonth();
  const thisYear  = new Date().getFullYear();
  const consultationsThisMonth = useMemo(
    () =>
      patients.filter(isActive).flatMap((p) => p.consultations).filter((c) => {
        const d = new Date(c.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length,
    [patients, thisMonth, thisYear]
  );

  // Statuses for ALL active patients (used by alert panel AND table)
  const allActiveStatuses = useMemo<Record<string, ClinicalStatus>>(() => {
    const map: Record<string, ClinicalStatus> = {};
    for (const p of patients.filter(isActive)) map[p.id] = computeStatus(p);
    return map;
  }, [patients]);

  // Alert panel data: patients with danger/warning clinical status OR overdue consultation
  const alertPatients = useMemo(() => {
    return patients
      .filter(isActive)
      .filter((p) => {
        const status = allActiveStatuses[p.id];
        if (status === 'danger' || status === 'warning') return true;
        const last = getLastConsultation(p.consultations);
        if (!last) return false;
        return getNextConsultInfo(last.date, p.birthDate).isOverdue;
      })
      .sort((a, b) => {
        const order: Record<string, number> = { danger: 0, warning: 1, normal: 2 };
        const ap = order[allActiveStatuses[a.id] ?? 'normal'] ?? 3;
        const bp = order[allActiveStatuses[b.id] ?? 'normal'] ?? 3;
        return ap - bp;
      });
  }, [patients, allActiveStatuses]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleReveal = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    setRevealedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const filteredPatients = useMemo(() => {
    const base = patients
      .filter((p) => (showArchived ? !isActive(p) : isActive(p)))
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.accessCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return base.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name, 'pt-BR');
      } else if (sortKey === 'lastConsult') {
        const aLast = getLastConsultation(a.consultations)?.date ?? '';
        const bLast = getLastConsultation(b.consultations)?.date ?? '';
        cmp = bLast.localeCompare(aLast);
      } else if (sortKey === 'age') {
        cmp = a.birthDate.localeCompare(b.birthDate);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [patients, searchTerm, showArchived, sortKey, sortDir]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && confirm) setConfirm(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [confirm]);

  const copyCode = async (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1500);
      showToast('Código copiado!');
    } catch { showToast('Não foi possível copiar o código.', 'error'); }
  };

  const requestArchive = (e: React.MouseEvent, id: string, pname: string) => {
    e.stopPropagation();
    setConfirm({
      title: 'Arquivar paciente',
      message: `Arquivar "${pname}"? Ele sairá da lista ativa, mas os dados são preservados.`,
      confirmLabel: 'Arquivar',
      onConfirm: () => { archivePatient(id); setConfirm(null); showToast(`"${pname}" foi arquivado.`, 'info'); },
    });
  };

  const requestDelete = (e: React.MouseEvent, id: string, pname: string) => {
    e.stopPropagation();
    setConfirm({
      title: 'Excluir definitivamente',
      message: `Excluir permanentemente "${pname}" e todo o histórico? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
      onConfirm: () => { deletePatient(id); setConfirm(null); showToast(`"${pname}" foi excluído.`, 'info'); },
    });
  };

  return (
    <>
      {/* Topbar */}
      <div className="shell-topbar">
        <span className="shell-topbar-title">
          Meus Pacientes
          <span className="topbar-count-badge">{activeCount}</span>
        </span>
        <div className="shell-topbar-right">
          <button className="btn btn-primary" onClick={() => navigate('/generator')}>
            <TrendingUp size={15} /> Novo Paciente
          </button>
        </div>
      </div>

      <div className="shell-content-inner">
        {/* Stats row */}
        <div className="dashboard-stats-row" style={{ marginBottom: 16 }}>
          <div className="dashboard-stat-card" style={{ '--stat-line': 'var(--color-primary)' } as React.CSSProperties}>
            <div className="stat-card-icon-wrap" style={{ background: 'rgba(11,122,110,0.1)', color: 'var(--color-primary)' }}>
              <Users size={18} />
            </div>
            <div>
              <div className="stat-card-value">{activeCount}</div>
              <div className="stat-card-label">Pacientes ativos</div>
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ '--stat-line': 'var(--color-warning-cl)' } as React.CSSProperties}>
            <div className="stat-card-icon-wrap" style={{ background: 'rgba(180,83,9,0.1)', color: 'var(--color-warning-cl)' }}>
              <FolderOpen size={18} />
            </div>
            <div>
              <div className="stat-card-value">{archivedCount}</div>
              <div className="stat-card-label">Arquivados</div>
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ '--stat-line': 'var(--color-accent)' } as React.CSSProperties}>
            <div className="stat-card-icon-wrap" style={{ background: 'rgba(201,112,122,0.1)', color: 'var(--color-accent)' }}>
              <CalendarDays size={18} />
            </div>
            <div>
              <div className="stat-card-value">{consultationsThisMonth}</div>
              <div className="stat-card-label">Avaliações este mês</div>
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ '--stat-line': 'var(--color-danger-cl)' } as React.CSSProperties}>
            <div className="stat-card-icon-wrap" style={{ background: 'rgba(185,28,28,0.1)', color: 'var(--color-danger-cl)' }}>
              <Bell size={18} />
            </div>
            <div>
              <div className="stat-card-value">{alertPatients.length}</div>
              <div className="stat-card-label">Precisam de atenção</div>
            </div>
          </div>
        </div>

        {/* Alert panel */}
        {alertPatients.length > 0 && !showArchived && (
          <div className="alert-panel" style={{ marginBottom: 16 }}>
            <button
              className="alert-panel-header"
              onClick={() => setAlertExpanded((v) => !v)}
              aria-expanded={alertExpanded}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} style={{ color: 'var(--color-warning-cl)' }} />
                <span className="alert-panel-title">
                  Pacientes que precisam de atenção
                </span>
                <span className="alert-panel-count">{alertPatients.length}</span>
              </div>
              {alertExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {alertExpanded && (
              <div className="alert-panel-body">
                {alertPatients.map((p) => {
                  const status = allActiveStatuses[p.id];
                  const last = getLastConsultation(p.consultations);
                  const nextInfo = last ? getNextConsultInfo(last.date, p.birthDate) : null;
                  const initials = p.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
                  return (
                    <div
                      key={p.id}
                      className="alert-patient-row"
                      onClick={() => navigate(`/patient/${p.id}`)}
                    >
                      <div className={`patient-initials ${p.gender === 'F' ? 'pi-f' : 'pi-m'}`} style={{ width: 28, height: 28, fontSize: 10 }}>
                        {initials}
                      </div>
                      <span className="alert-patient-name">{p.name}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                        {(status === 'danger' || status === 'warning') && (
                          <ClinicalStatusBadge status={status} hasConsultation={true} />
                        )}
                        {nextInfo?.isOverdue && (
                          <span className="next-consult-badge overdue">
                            <Clock size={10} /> {nextInfo.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="dashboard-toolbar">
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome, responsável ou código…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-tabs-row">
            <button className={`filter-tab-btn${!showArchived ? ' active' : ''}`} onClick={() => setShowArchived(false)}>
              Ativos ({activeCount})
            </button>
            <button className={`filter-tab-btn${showArchived ? ' active' : ''}`} onClick={() => setShowArchived(true)}>
              Arquivados ({archivedCount})
            </button>
          </div>
        </div>

        {/* Table */}
        {filteredPatients.length === 0 ? (
          <div className="card muted-block">
            {searchTerm ? (
              <>
                <Search size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <p style={{ marginBottom: '0.75rem' }}>
                  Nenhum paciente encontrado para <strong>"{searchTerm}"</strong>.
                </p>
                <button className="btn btn-ghost" onClick={() => setSearchTerm('')}>Limpar busca</button>
              </>
            ) : showArchived ? (
              <>
                <FolderOpen size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <p>Nenhum paciente arquivado.</p>
              </>
            ) : (
              <>
                <Users size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <p style={{ marginBottom: '1rem' }}>
                  {patients.length === 0 ? 'Nenhum paciente cadastrado ainda.' : 'Nenhum paciente ativo no momento.'}
                </p>
                {patients.length === 0 && (
                  <button className="btn btn-primary" onClick={() => navigate('/generator')}>
                    <TrendingUp size={15} /> Cadastrar primeiro paciente
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th className="th-sortable" onClick={() => handleSort('name')}>
                    Paciente <SortIcon field="name" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th>Responsável</th>
                  <th className="th-sortable" onClick={() => handleSort('lastConsult')}>
                    Última Avaliação <SortIcon field="lastConsult" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th>Próxima Consulta</th>
                  <th>Status Clínico</th>
                  <th>Código</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const lastConsult = getLastConsultation(patient.consultations);
                  const initials = patient.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
                  const clinicalStatus = allActiveStatuses[patient.id];
                  const isRevealed = revealedCodes.has(patient.accessCode);
                  const nextInfo = lastConsult ? getNextConsultInfo(lastConsult.date, patient.birthDate) : null;

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => navigate(`/patient/${patient.id}`)}
                      style={{ cursor: 'pointer', ...(!isActive(patient) ? { opacity: 0.7 } : {}) }}
                    >
                      <td>
                        <div className="patient-cell">
                          <div className={`patient-initials ${patient.gender === 'F' ? 'pi-f' : 'pi-m'}`}>{initials}</div>
                          <div>
                            <div className="patient-cell-name">{patient.name}</div>
                            <span className="patient-cell-age">{calculateAge(patient.birthDate)}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{patient.parentName}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)', fontSize: 13 }}>
                        {lastConsult ? formatDate(lastConsult.date) : <span style={{ opacity: 0.5 }}>—</span>}
                      </td>
                      <td>
                        {nextInfo ? (
                          <span className={`next-consult-badge ${nextInfo.urgency}`}>
                            <Clock size={10} /> {nextInfo.label}
                          </span>
                        ) : (
                          <span style={{ opacity: 0.4, fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <ClinicalStatusBadge status={clinicalStatus} hasConsultation={patient.consultations.length > 0} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="access-code" style={{ fontSize: 11, letterSpacing: isRevealed ? '0.12em' : 'normal' }}>
                            {isRevealed ? patient.accessCode : '••••••'}
                          </span>
                          <button
                            className="table-icon-btn"
                            title={isRevealed ? 'Ocultar código' : 'Revelar código'}
                            onClick={(e) => toggleReveal(e, patient.accessCode)}
                          >
                            {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          {isRevealed && (
                            <button className="table-icon-btn" title="Copiar código" onClick={(e) => copyCode(e, patient.accessCode)}>
                              {copiedCode === patient.accessCode
                                ? <Check size={13} style={{ color: 'var(--color-normal)' }} />
                                : <Copy size={13} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isActive(patient) ? (
                            <>
                              <button className="table-action-btn" onClick={(e) => { e.stopPropagation(); navigate(`/patient/${patient.id}`); }}>
                                Ver perfil
                              </button>
                              <button className="table-icon-btn" title={`Arquivar ${patient.name}`} onClick={(e) => requestArchive(e, patient.id, patient.name)}>
                                <Archive size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="table-action-btn" onClick={(e) => { e.stopPropagation(); restorePatient(patient.id); showToast(`"${patient.name}" foi restaurado.`); }}>
                                <ArchiveRestore size={13} /> Restaurar
                              </button>
                              <button className="table-icon-btn danger" title={`Excluir ${patient.name}`} onClick={(e) => requestDelete(e, patient.id, patient.name)}>
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-card" style={{ maxWidth: '24rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: confirm.danger ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)', color: confirm.danger ? 'var(--color-danger-cl)' : 'var(--color-warning-cl)' }}>
                <AlertTriangle size={18} />
              </div>
              <h2 className="text-lg font-bold text-dark m-0">{confirm.title}</h2>
            </div>
            <p className="text-sm text-muted mb-4">{confirm.message}</p>
            <div className="flex gap-2">
              <button className="btn btn-outline flex-1" onClick={() => setConfirm(null)}>Cancelar</button>
              <button className={`btn flex-1${confirm.danger ? ' btn-danger' : ' btn-primary'}`} onClick={confirm.onConfirm}>
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Sub-components ────────────────────────────────────────────

const SortIcon: React.FC<{ field: SortKey; sortKey: SortKey; sortDir: SortDir }> = ({ field, sortKey, sortDir }) => {
  if (sortKey !== field) return <ChevronUp size={11} style={{ opacity: 0.3, marginLeft: 2 }} />;
  return sortDir === 'asc'
    ? <ChevronUp size={11} style={{ opacity: 0.9, marginLeft: 2, color: 'var(--color-primary)' }} />
    : <ChevronDown size={11} style={{ opacity: 0.9, marginLeft: 2, color: 'var(--color-primary)' }} />;
};

const ClinicalStatusBadge: React.FC<{ status: ClinicalStatus; hasConsultation: boolean }> = ({ status, hasConsultation }) => {
  if (!hasConsultation) return <span className="clinical-status-chip status-none"><Minus size={11} /> Sem avaliação</span>;
  if (!status) return <span className="clinical-status-chip status-none"><Minus size={11} /> —</span>;
  if (status === 'normal')  return <span className="clinical-status-chip status-normal-chip"><CheckCircle size={11} /> Normal</span>;
  if (status === 'warning') return <span className="clinical-status-chip status-warning-chip"><AlertTriangle size={11} /> Atenção</span>;
  return <span className="clinical-status-chip status-danger-chip"><XCircle size={11} /> Risco</span>;
};

export default Dashboard;
