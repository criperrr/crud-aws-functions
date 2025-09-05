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
        resultDestino = await prisma.remedio.findMany({
            orderBy: {
                id: 'asc'
            }
        });
    } else if (destino == "agendamentos") {
        resultDestino = await prisma.agendamento.findMany({
            orderBy: {
                remedio_id: 'asc'
            }
        });
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

    const rutaBase = event.rawPath + "";
    const stage = event.requestContext?.stage || '';
    const resource = rutaBase.split(`/${stage}/`)[1]?.replaceAll("/", "")

    const destino = possibleRoutes[`/${resource}`];

    if (!destino) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: 'Invalid route.',
                "route": rutaBase,
                "stage": stage,
                "resource": resource,
                "destino": destino
            }),
        };
    }

    try {
        const result = await selectQuery(destino);
        return {
            statusCode: 200,
            body: JSON.stringify({ resource: destino, data: result }),
            headers: { "Content-Type": "application/json" },
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Internal server error: ${error.message}` }),
            headers: { "Content-Type": "application/json" },
        };
    }
};