// readLambda.js - CORRIGIDO
import { PrismaClient } from '@prisma/client';

/** @type {PrismaClient} */
let prisma;

if (!global.prisma) {
    global.prisma = new PrismaClient();;
}
/** @type {PrismaClient} */
prisma = global.prisma;

async function selectQuery(destino) {
    let resultDestino;
    if (destino == "medicamentos") {
        resultDestino = await prisma.remedio.findMany();
    } else if (destino == "agendamentos") {
        resultDestino = await prisma.agendamento.findMany();
    } else {
        throw new Error('Invalid route.');
    }
    return resultDestino;
}

export const handler = async (event) => {
    const possibleRoutes = {
        '/medicamentos': 'medicamentos',
        '/agendamentos': 'agendamentos',
    };

    // --- Início da Correção ---
    // 1. Pega a rota completa, por exemplo: "/medicamentos" ou "/medicamentos/123"
    // 2. Divide a string pelo caractere '/', resultando em um array: ["", "medicamentos", "123"]
    // 3. Pega o segundo elemento do array ('medicamentos'), que é o nome do recurso.
    const rutaBase = event.path.split('/')[1];

    // 4. Monta a chave de busca para o objeto possibleRoutes: `/${rutaBase}` -> "/medicamentos"
    const destino = possibleRoutes[`/${rutaBase}`];
    // --- Fim da Correção ---

    if (!destino) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid route.' }),
            headers: { "Content-Type": "application/json" },
        };
    }

    try {
        const result = await selectQuery(destino);
        return {
            statusCode: 200,
            body: JSON.stringify({ [destino]: result }),
            headers: { "Content-Type": "application/json" },
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Internal server error: ${error.message}` }),
            headers: { "Content-Type": "application/json" },
        };
    }
};