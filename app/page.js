'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTracking } from '../hooks/useTracking';
import { useWhatsApp } from '../context/WhatsAppContext';
import { validatePhone, formatPhoneDisplay } from '../lib/phoneValidator';

function parseValorNumerico(str) {
  const cleaned = String(str || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export default function Page() {
  const tracking = useTracking();
  const { buildLink } = useWhatsApp();

  const [step, setStep] = useState(1);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');

  const [ocupacao, setOcupacao] = useState('');
  const [vinculo, setVinculo] = useState('');
  const [rendaMensal, setRendaMensal] = useState('');
  const [valorDesejado, setValorDesejado] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');

  const [errors, setErrors] = useState({});
  const [cltRejected, setCltRejected] = useState(false);

  const phoneDigits = useMemo(() => String(telefone || '').replace(/\D/g, ''), [telefone]);
  const phoneResult = useMemo(() => validatePhone(phoneDigits), [phoneDigits]);
  const phoneDisplay = useMemo(() => (phoneDigits ? formatPhoneDisplay(phoneDigits) : ''), [phoneDigits]);

  const emailValid = useMemo(() => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const step1Valid = useMemo(() => Boolean(
    nome.trim().length > 1 &&
    phoneResult.valid &&
    emailValid &&
    cidade.trim().length > 1
  ), [nome, phoneResult, emailValid, cidade]);

  const step2Valid = useMemo(() => {
    const base = Boolean(
      ocupacao.trim().length > 1 &&
      (vinculo === 'CLT' || vinculo === 'PJ') &&
      rendaMensal.trim().length > 0 &&
      valorDesejado.trim().length > 0
    );
    if (vinculo === 'PJ') return base && nomeEmpresa.trim().length > 1;
    return base;
  }, [ocupacao, vinculo, rendaMensal, valorDesejado, nomeEmpresa]);

  useEffect(() => {
    tracking.trackViewContent();
  }, [tracking]);

  const goToStep2 = () => {
    const newErrors = {};
    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!phoneResult.valid) newErrors.telefone = phoneResult.error || 'Telefone inválido';
    if (email && !emailValid) newErrors.email = 'Email inválido';
    if (!cidade.trim()) newErrors.cidade = 'Cidade é obrigatória';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(2);
  };

  const goToStep1 = () => {
    setErrors({});
    setStep(1);
  };

  const onSubmit = () => {
    const newErrors = {};
    if (!ocupacao.trim()) newErrors.ocupacao = 'Ocupação é obrigatória';
    if (vinculo !== 'CLT' && vinculo !== 'PJ') newErrors.vinculo = 'Selecione uma opção';
    if (!rendaMensal.trim()) newErrors.rendaMensal = 'Renda mensal é obrigatória';
    if (!valorDesejado.trim()) newErrors.valorDesejado = 'Valor desejado é obrigatório';
    if (vinculo === 'PJ' && !nomeEmpresa.trim()) newErrors.nomeEmpresa = 'Nome da empresa é obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const contactBase = {
      nome: nome.trim(),
      ocupacao: ocupacao.trim(),
      vinculo,
      telefone: phoneDigits,
      email: email.trim() || undefined,
      cidade: cidade.trim(),
      rendaMensal: String(parseValorNumerico(rendaMensal)),
      valorDesejado: String(parseValorNumerico(valorDesejado)),
      nomeEmpresa: vinculo === 'PJ' ? nomeEmpresa.trim() : '',
    };

    if (vinculo === 'CLT') {
      // Não abre WhatsApp, não dispara Pixel — só registra no banco para controle.
      saveContactAsync(contactBase);
      setCltRejected(true);
      return;
    }

    const link = buildLink({
      nome: nome.trim(),
      cidade: cidade.trim(),
      telefone: phoneDisplay || phoneDigits,
      ocupacao: ocupacao.trim(),
      vinculo,
      rendaMensal: rendaMensal.trim(),
      valorDesejado: valorDesejado.trim(),
      nomeEmpresa: nomeEmpresa.trim(),
    });

    window.open(link, '_blank', 'noopener,noreferrer');

    tracking.trackContact({
      nome: nome.trim(),
      telefone: phoneDigits,
      email: email.trim() || undefined,
      cidade: cidade.trim(),
      vinculo,
      valorDesejado: parseValorNumerico(valorDesejado),
    });

    saveContactAsync({ ...contactBase, whatsappLink: link });
  };

  const saveContactAsync = async (data) => {
    try {
      const response = await fetch('/api/save-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      });
      if (!response.ok) {
        console.warn('Erro ao salvar contato:', response.status);
      }
    } catch (error) {
      console.warn('Erro ao conectar com servidor:', error);
    }
  };

  return (
    <main className="container">
      <section className="card">
        <div className="badge">
          <i className="fa-solid fa-lock" style={{ color: 'var(--gold)' }}></i>
          Atendimento rápido e seguro
        </div>
        <h1 className="h1">Fale com um especialista agora no WhatsApp</h1>
        <p className="subtitle">Preencha seus dados e receba uma resposta rápida, com atendimento humano e sigiloso.</p>

        <div className="step-indicator">Passo {step} de 2</div>

        <div className="form" role="form" aria-label="Formulário de contato">
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="label" htmlFor="nome">
                  Nome *
                </label>
                <input
                  id="nome"
                  className={`input ${errors.nome ? 'input-error' : ''}`}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                />
                {errors.nome && <span className="error-message">{errors.nome}</span>}
              </div>

              <div className="form-group">
                <label className="label" htmlFor="telefone">
                  Telefone *
                </label>
                <input
                  id="telefone"
                  className={`input ${errors.telefone ? 'input-error' : ''}`}
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="DD + número (ex: 31987654321)"
                  autoComplete="tel"
                  inputMode="numeric"
                />
                {errors.telefone && <span className="error-message">{errors.telefone}</span>}
                {phoneResult.valid && phoneDisplay && (
                  <span className="trust-text">
                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--brand)' }}></i> {phoneDisplay}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="label" htmlFor="email">
                  Email (opcional)
                </label>
                <input
                  id="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  type="email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="label" htmlFor="cidade">
                  Cidade *
                </label>
                <input
                  id="cidade"
                  className={`input ${errors.cidade ? 'input-error' : ''}`}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Belo Horizonte"
                  autoComplete="address-level2"
                />
                {errors.cidade && <span className="error-message">{errors.cidade}</span>}
              </div>

              <div className="cta">
                <button
                  className="btn-whatsapp"
                  type="button"
                  onClick={goToStep2}
                  disabled={!step1Valid}
                >
                  Próximo passo
                </button>
              </div>
            </>
          )}

          {step === 2 && cltRejected && (
            <div className="reject-message">
              <i className="fa-solid fa-circle-info" style={{ color: 'var(--brand)', fontSize: '28px' }}></i>
              <p className="reject-title">No momento, atendemos apenas autônomos e empresas (PJ)</p>
              <p className="subtitle">
                Assim que abrirmos vagas para quem trabalha de carteira assinada (CLT), avisaremos por aqui. Obrigado pelo interesse!
              </p>
            </div>
          )}

          {step === 2 && !cltRejected && (
            <>
              <div className="form-group">
                <label className="label" htmlFor="ocupacao">
                  Cargo / Função / Ocupação *
                </label>
                <input
                  id="ocupacao"
                  className={`input ${errors.ocupacao ? 'input-error' : ''}`}
                  value={ocupacao}
                  onChange={(e) => setOcupacao(e.target.value)}
                  placeholder="Ex: Vendedor, Motorista, Enfermeiro..."
                  autoComplete="organization-title"
                />
                {errors.ocupacao && <span className="error-message">{errors.ocupacao}</span>}
              </div>

              <div className="form-group">
                <label className="label">Como você trabalha? *</label>
                <div className="toggle-group" role="group" aria-label="Como você trabalha">
                  <button
                    type="button"
                    className={`toggle-option ${vinculo === 'CLT' ? 'active' : ''}`}
                    aria-pressed={vinculo === 'CLT'}
                    onClick={() => setVinculo('CLT')}
                  >
                    CLT (carteira assinada)
                  </button>
                  <button
                    type="button"
                    className={`toggle-option ${vinculo === 'PJ' ? 'active' : ''}`}
                    aria-pressed={vinculo === 'PJ'}
                    onClick={() => setVinculo('PJ')}
                  >
                    PJ (Autônomo)
                  </button>
                </div>
                {errors.vinculo && <span className="error-message">{errors.vinculo}</span>}
              </div>

              {vinculo === 'PJ' && (
                <div className="form-group">
                  <label className="label" htmlFor="nomeEmpresa">
                    Nome da Empresa *
                  </label>
                  <input
                    id="nomeEmpresa"
                    className={`input ${errors.nomeEmpresa ? 'input-error' : ''}`}
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    placeholder="Nome da sua empresa"
                    autoComplete="organization"
                  />
                  {errors.nomeEmpresa && <span className="error-message">{errors.nomeEmpresa}</span>}
                </div>
              )}

              <div className="form-group">
                <label className="label" htmlFor="rendaMensal">
                  Renda Mensal *
                </label>
                <input
                  id="rendaMensal"
                  className={`input ${errors.rendaMensal ? 'input-error' : ''}`}
                  value={rendaMensal}
                  onChange={(e) => setRendaMensal(e.target.value)}
                  placeholder="Digite o valor exato da sua renda mensal"
                  inputMode="numeric"
                />
                {errors.rendaMensal && <span className="error-message">{errors.rendaMensal}</span>}
              </div>

              <div className="form-group">
                <label className="label" htmlFor="valorDesejado">
                  Valor desejado *
                </label>
                <input
                  id="valorDesejado"
                  className={`input ${errors.valorDesejado ? 'input-error' : ''}`}
                  value={valorDesejado}
                  onChange={(e) => setValorDesejado(e.target.value)}
                  placeholder="Digite o valor exato desejado"
                  inputMode="numeric"
                />
                {errors.valorDesejado && <span className="error-message">{errors.valorDesejado}</span>}
              </div>

              <div className="step-actions">
                <button className="btn-secondary" type="button" onClick={goToStep1}>
                  Voltar
                </button>
                <button
                  className="btn-whatsapp"
                  type="button"
                  onClick={onSubmit}
                  disabled={!step2Valid}
                >
                  <i className="fa-brands fa-whatsapp"></i>
                  CHAMAR NO WHATSAPP
                </button>
              </div>
              <div className="trust">
                <i className="fa-solid fa-lock" style={{ color: 'var(--gold)', fontSize: '11px' }}></i>
                Seus dados são protegidos e usados apenas para contato e atendimento.
              </div>
            </>
          )}
        </div>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} Atendimento via WhatsApp. Todos os direitos reservados.
      </footer>
    </main>
  );
}
