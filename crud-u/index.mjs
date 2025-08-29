import { PrismaClient } from '@prisma/client';

/** @type {PrismaClient} */
let prisma;

if (!global.prisma) {
    global.prisma = new PrismaClient();;
}
/** @type {PrismaClient} */
prisma = global.prisma;

async function updateQuery(destino, id, body) {
    let resultDestino;
    if (destino === "medicamentos") {
        resultDestino = await prisma.remedio.update({
            where: { id },
            data: body,
        });
    } else if (destino === "agendamentos") {
        resultDestino = await prisma.agendamento.update({
            where: { remedio_id: id },
            data: body,
        });
    } else {
        throw new Error('Invalid route.');
    }
    return resultDestino;
}

export const handler = async (event) => {
    const body = event.body ? JSON.parse(event.body) : {};
    let id = event.pathParameters?.id;

    if (!id || Object.keys(body).length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid body or null Id.' }),
            headers: { "Content-Type": "application/json" },
        };
    }

    id = parseInt(id, 10);
    if (isNaN(id)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid ID type.' }),
            headers: { "Content-Type": "application/json" },
        };
    }

    for (const [key, value] of Object.entries(body)) {
        if (value === null || value === undefined) {
            delete body[key];
        }
    }

    const possibleRoutes = {
        '/medicamentos': 'medicamentos',
        '/agendamentos': 'agendamentos',
    };
    const rutaBase = event.path.split('/')[1];
    const destino = possibleRoutes[`/${rutaBase}`];

    if (!destino) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid route.' }),
            headers: { "Content-Type": "application/json" },
        };
    }

    try {
        const result = await updateQuery(destino, id, body);
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
