import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Search,
  ChevronRight,
  LogOut,
  Copy,
  Check,
  Archive,
  ArchiveRestore,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Gender } from '../context/AppContext';
import Logo from '../components/Logo';

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patients, addPatient, archivePatient, restorePatient, deletePatient } =
    useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);

  // New Patient Form State
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('M');
  const [parentName, setParentName] = useState('');
  const [formError, setFormError] = useState('');

  // Date bounds: max = today (no future births), min = 18 years ago.
  const todayStr = new Date().toISOString().split('T')[0];
  const minBirthStr = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  const isActive = (p: { status?: string }) => (p.status ?? 'active') === 'active';

  const activeCount = useMemo(() => patients.filter(isActive).length, [patients]);
  const archivedCount = patients.length - activeCount;

  const filteredPatients = useMemo(
    () =>
      patients
        .filter((p) => (showArchived ? !isActive(p) : isActive(p)))
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.accessCode.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [patients, searchTerm, showArchived]
  );

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !birthDate || !parentName.trim()) {
      setFormError('Preencha nome, data de nascimento e responsável.');
      return;
    }

    const birth = new Date(birthDate + 'T00:00:00');
    if (Number.isNaN(birth.getTime())) {
      setFormError('Data de nascimento inválida.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (birth.getTime() > today.getTime()) {
      setFormError('A data de nascimento não pode ser no futuro.');
      return;
    }

    const minBirth = new Date();
    minBirth.setFullYear(minBirth.getFullYear() - 18);
    minBirth.setHours(0, 0, 0, 0);
    if (birth.getTime() < minBirth.getTime()) {
      setFormError('Data muito antiga: o paciente deve ter no máximo 18 anos.');
      return;
    }

    addPatient({
      name: name.trim(),
      birthDate,
      gender,
      parentName: parentName.trim(),
    });
    setShowModal(false);
    setFormError('');
    setName('');
    setBirthDate('');
    setGender('M');
    setParentName('');
  };

  const calculateAge = (birthDateString: string) => {
    const today = new Date();
    const birth = new Date(birthDateString);
    if (Number.isNaN(birth.getTime()) || birth.getTime() > today.getTime()) {
      return 'Data inválida';
    }
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    if (years === 0) {
      return months <= 0 ? 'recém-nascido' : `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    return `${years}a ${months}m`;
  };

  const copyCode = async (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  };

  // ---- Logout with confirmation (prevents accidental session loss) ----
  const requestLogout = () => {
    setConfirm({
      title: 'Encerrar sessão',
      message:
        'Deseja realmente sair? Avaliações não salvas em formulários abertos serão perdidas.',
      confirmLabel: 'Sair',
      onConfirm: () => {
        setConfirm(null);
        navigate('/');
      },
    });
  };

  const requestArchive = (e: React.MouseEvent, id: string, pname: string) => {
    e.stopPropagation();
    setConfirm({
      title: 'Arquivar paciente',
      message: `Arquivar "${pname}"? Ele sairá da lista ativa, mas os dados são preservados e podem ser restaurados.`,
      confirmLabel: 'Arquivar',
      onConfirm: () => {
        archivePatient(id);
        setConfirm(null);
      },
    });
  };

  const requestDelete = (e: React.MouseEvent, id: string, pname: string) => {
    e.stopPropagation();
    setConfirm({
      title: 'Excluir definitivamente',
      message: `Excluir permanentemente "${pname}" e todo o histórico de consultas? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
      onConfirm: () => {
        deletePatient(id);
        setConfirm(null);
      },
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="page-header">
        <Logo size={36} withWordmark />
        <div className="flex items-center gap-2">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Novo Paciente
          </button>
          <button className="btn btn-ghost" title="Sair" onClick={requestLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Section title + status toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Meus Pacientes</h1>
          <p className="text-sm text-muted mt-1">
            {activeCount} {activeCount === 1 ? 'paciente ativo' : 'pacientes ativos'}
            {archivedCount > 0 ? ` • ${archivedCount} arquivado(s)` : ''}
          </p>
        </div>
        <div className="tabs" style={{ width: 'auto', marginBottom: 0 }}>
          <button
            className={`tab-btn ${!showArchived ? 'active' : ''}`}
            style={{ padding: '0.5rem 1rem' }}
            onClick={() => setShowArchived(false)}
          >
            Ativos
          </button>
          <button
            className={`tab-btn ${showArchived ? 'active' : ''}`}
            style={{ padding: '0.5rem 1rem' }}
            onClick={() => setShowArchived(true)}
          >
            Arquivados ({archivedCount})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar mb-6">
        <Search size={18} className="text-muted" />
        <input
          type="text"
          placeholder="Buscar por nome, responsável ou código…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patients grid */}
      {filteredPatients.length === 0 ? (
        <div className="card muted-block">
          <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>
            {showArchived
              ? 'Nenhum paciente arquivado.'
              : patients.length === 0
              ? 'Nenhum paciente cadastrado ainda. Clique em "Novo Paciente" para começar.'
              : 'Nenhum paciente corresponde à busca.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="patient-card"
              onClick={() =>
                isActive(patient) && navigate(`/patient/${patient.id}`)
              }
              style={!isActive(patient) ? { opacity: 0.85 } : undefined}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-dark">
                    {patient.name}
                  </h3>
                  <span
                    className={`chip ${
                      patient.gender === 'F' ? 'chip-accent' : 'chip-primary'
                    }`}
                  >
                    {patient.gender === 'M' ? 'Masc.' : 'Fem.'}
                  </span>
                </div>
                <p className="text-sm text-muted mb-1">
                  Responsável: <span className="text-dark">{patient.parentName}</span>
                </p>
                <p className="text-sm text-muted">
                  Idade: <span className="text-dark">{calculateAge(patient.birthDate)}</span>
                </p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted mb-1">Código dos pais</p>
                    <span className="access-code">{patient.accessCode}</span>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '0.5rem' }}
                    title="Copiar código"
                    onClick={(e) => copyCode(e, patient.accessCode)}
                  >
                    {copiedCode === patient.accessCode ? (
                      <Check size={16} style={{ color: '#16a34a' }} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div
                className="mt-4 pt-3"
                style={{
                  borderTop: '1px solid var(--color-gray-100)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {isActive(patient) ? (
                  <>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      title="Arquivar paciente"
                      onClick={(e) => requestArchive(e, patient.id, patient.name)}
                    >
                      <Archive size={15} /> Arquivar
                    </button>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--color-primary)',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                      }}
                    >
                      {patient.consultations.length === 0
                        ? 'Sem avaliações'
                        : `${patient.consultations.length} aval.`}
                      <ChevronRight size={16} />
                    </span>
                  </>
                ) : (
                  <div className="flex gap-2" style={{ width: '100%' }}>
                    <button
                      className="btn btn-outline flex-1"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        restorePatient(patient.id);
                      }}
                    >
                      <ArchiveRestore size={15} /> Restaurar
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-accent)',
                      }}
                      onClick={(e) => requestDelete(e, patient.id, patient.name)}
                    >
                      <Trash2 size={15} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Patient Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-dark mb-4">Novo Paciente</h2>
            <form onSubmit={handleAddPatient} className="flex flex-col gap-3">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Nome da Criança</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Maria Eduarda"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Data de Nascimento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    min={minBirthStr}
                    max={todayStr}
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Sexo</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Nome do Responsável</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                  placeholder="Ex: Camila Souza"
                />
              </div>

              {formError && (
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-accent)', marginTop: '0.25rem' }}
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal (logout / archive / delete) */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: '24rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: confirm.danger
                    ? 'rgba(255,139,139,0.18)'
                    : 'rgba(34,182,168,0.12)',
                  color: confirm.danger ? '#dc2626' : 'var(--color-primary-dark)',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-lg font-bold text-dark m-0">{confirm.title}</h2>
            </div>
            <p className="text-sm text-muted mb-4">{confirm.message}</p>
            <div className="flex gap-2">
              <button
                className="btn btn-outline flex-1"
                onClick={() => setConfirm(null)}
              >
                Cancelar
              </button>
              <button
                className="btn flex-1"
                style={
                  confirm.danger
                    ? { background: '#dc2626', color: '#fff' }
                    : { background: 'var(--color-primary)', color: '#fff' }
                }
                onClick={confirm.onConfirm}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
