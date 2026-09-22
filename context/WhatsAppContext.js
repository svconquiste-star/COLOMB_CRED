'use client';

import { createContext, useContext } from 'react';

const WHATSAPP_PHONE = '5531984213573';

const WhatsAppContext = createContext({
  phone: WHATSAPP_PHONE,
  buildLink: () => '',
});

export function WhatsAppProvider({ children }) {
  const buildLink = ({
    nome,
    cidade,
    telefone,
    ocupacao,
    vinculo,
    rendaMensal,
    valorDesejado,
    nomeEmpresa,
  }) => {
    const n = nome ? nome.trim() : '[NOME]';
    const c = cidade ? cidade.trim() : '[CIDADE]';
    const t = telefone || '[TELEFONE]';
    const o = ocupacao ? ocupacao.trim() : '[OCUPAÇÃO]';
    const v = vinculo || '[VÍNCULO]';
    const r = rendaMensal || '[RENDA]';
    const vd = valorDesejado || '[VALOR]';

    let message = `Olá! Sou ${n}. Quero falar com um especialista.\n` +
      `Ocupação: ${o}\n` +
      `Vínculo: ${v}\n`;

    if (vinculo === 'PJ' && nomeEmpresa) {
      message += `Empresa: ${nomeEmpresa.trim()}\n`;
    }

    message += `Cidade: ${c}\n` +
      `Renda mensal: ${r}\n` +
      `Valor desejado: ${vd}\n` +
      `Telefone: ${t}`;

    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  };

  return (
    <WhatsAppContext.Provider value={{ phone: WHATSAPP_PHONE, buildLink }}>
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsApp() {
  return useContext(WhatsAppContext);
}
