import { z } from 'zod';

// Etapa 1: Dados Básicos
export const submitContactStep1Schema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(255, 'Nome muito longo')
    .trim(),

  telefone: z
    .string()
    .regex(/^\d{10,13}$/, 'Telefone inválido (10-13 dígitos)')
    .transform(d => d.startsWith('55') ? d : `55${d}`),

  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .optional()
    .or(z.literal('')),

  cidade: z
    .string()
    .min(2, 'Cidade deve ter ao menos 2 caracteres')
    .max(255, 'Cidade muito longa')
    .trim(),
});

// Etapa 2: Qualificação
export const submitContactStep2Schema = z.object({
  ocupacao: z
    .string()
    .min(2, 'Ocupação deve ter ao menos 2 caracteres')
    .max(255, 'Ocupação muito longa')
    .trim(),

  vinculo: z
    .enum(['CLT', 'PJ'], 'Selecione CLT ou PJ'),

  rendaMensal: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), 'Renda mensal deve ser um número')
    .refine((val) => parseFloat(val) > 0, 'Renda mensal deve ser maior que zero')
    .transform((val) => parseFloat(val)),

  valorDesejado: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), 'Valor desejado deve ser um número')
    .refine((val) => parseFloat(val) > 0, 'Valor desejado deve ser maior que zero')
    .transform((val) => parseFloat(val)),

  nomeEmpresa: z
    .string()
    .max(255, 'Nome da empresa muito longo')
    .trim()
    .optional()
    .or(z.literal('')),
});

// Schema combinado
export const submitContactSchema = submitContactStep1Schema
  .and(submitContactStep2Schema)
  .and(
    z.object({
      projeto: z
        .string()
        .min(2, 'Projeto deve ter ao menos 2 caracteres')
        .max(255, 'Projeto muito longo')
        .trim()
        .optional(),

      whatsappLink: z
        .string()
        .url('Link WhatsApp inválido')
        .optional(),
    })
  )
  .refine(
    (data) => {
      if (data.vinculo === 'PJ') {
        return data.nomeEmpresa && data.nomeEmpresa.trim().length >= 2;
      }
      return true;
    },
    {
      message: 'Nome da empresa é obrigatório para PJ e deve ter ao menos 2 caracteres',
      path: ['nomeEmpresa'],
    }
  );
