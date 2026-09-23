import { NextResponse } from 'next/server';
import { createContact } from '@/lib/api/contactService';

export async function POST(request) {
  try {
    const body = await request.json();

    // Extrair IP e User-Agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-client-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent');

    // Criar contato no DB
    const contact = await createContact(body, ipAddress, userAgent);

    // Resposta sucesso
    return NextResponse.json({
      success: true,
      contactId: contact.id,
    }, { status: 201 });

  } catch (error) {
    // Validation errors
    if (error.name === 'ZodError' && error.errors) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Generic errors
    console.error('[API /save-contact] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar dados' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 200 });
}
