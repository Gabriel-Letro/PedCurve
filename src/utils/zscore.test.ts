import { describe, it, expect } from 'vitest';
import { calculateAllZScores } from './zscore';

describe('Z-Score Calculator based on WHO Reference Tables', () => {
  // Testes para Altura por Idade (Meninos, 0-5 anos)
  // Referência (lhfa_boys_0_5) Month 0: L=1, M=49.8842, S=0.03795
  // SD0 = 49.9, SD2 = 53.7, SD3neg = 44.2
  it('deve calcular corretamente a Altura por Idade (Meninos, Nascimento)', () => {
    // SD0 (Adequado)
    let result = calculateAllZScores('M', 0, undefined, 49.9, undefined);
    expect(result.height.status).toBe('normal');
    expect(result.height.message).toBe('Adequado');

    // SD2 (Acima do esperado) - vamos testar um pouco acima de SD2 para dar warning (Z > 2)
    result = calculateAllZScores('M', 0, undefined, 54.0, undefined);
    expect(result.height.status).toBe('warning');
    expect(result.height.message).toBe('Acima do esperado');
    
    // SD3neg (Abaixo de -3 => Severamente abaixo do esperado)
    result = calculateAllZScores('M', 0, undefined, 44.0, undefined);
    expect(result.height.status).toBe('danger');
    expect(result.height.message).toBe('Severamente abaixo do esperado');
  });

  // Referência (lhfa_boys_0_5) Month 24 (2 anos): L=1, M=87.8161, S=0.03479
  // SD0 = 87.8, SD2neg = 81.7, SD3 = 97
  it('deve calcular corretamente a Altura por Idade (Meninos, 2 anos / 24 meses)', () => {
    let result = calculateAllZScores('M', 24, undefined, 87.1, undefined);
    expect(result.height.status).toBe('normal');

    result = calculateAllZScores('M', 24, undefined, 80.0, undefined);
    expect(result.height.status).toBe('warning');
    expect(result.height.message).toBe('Abaixo do esperado');

    result = calculateAllZScores('M', 24, undefined, 97.0, undefined);
    expect(result.height.status).toBe('danger');
    expect(result.height.message).toBe('Severamente acima do esperado');
  });

  // Testes de Perímetro Cefálico
  // O perímetro cefálico deve funcionar apenas até os 5 anos (60 meses)
  it('deve calcular corretamente o Perímetro Cefálico até 5 anos e ignorar acima disso', () => {
    let result = calculateAllZScores('F', 12, undefined, undefined, 45.0); // 1 ano (12 meses)
    expect(result.headCirc.status).not.toBe('unknown');

    result = calculateAllZScores('M', 61, undefined, undefined, 50.0); // > 5 anos
    expect(result.headCirc.status).toBe('unknown');
    expect(result.headCirc.message).toBe('Apenas para 0 a 5 anos');
  });

  // Testes de Peso por Idade
  it('deve calcular corretamente o Peso por Idade (Meninos, Nascimento)', () => {
    // Referência OMS (wfa_boys_0_5) Peso Meninos 0 meses: L=0.3487, M=3.3464, S=0.14602
    // Z = 0 é ~3.3 kg
    let result = calculateAllZScores('M', 0, 3.3, undefined, undefined);
    expect(result.weight.status).toBe('normal');

    // Peso excessivo para recém-nascido (Z > 3 => Severamente acima do esperado)
    result = calculateAllZScores('M', 0, 5.5, undefined, undefined);
    expect(result.weight.status).toBe('danger');
    expect(result.weight.message).toBe('Severamente acima do esperado');
  });
});
