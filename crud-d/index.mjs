import { PrismaClient } from '@prisma/client';

/** @type {PrismaClient} */
let prisma;

if (!global.prisma) {
    global.prisma = new PrismaClient();;
}
/** @type {PrismaClient} */
prisma = global.prisma;


async function deleteQuery(destino, id) {
    let resultDestino;
    if (destino === "medicamentos") {
        resultDestino = await prisma.remedio.delete({
            where: {
                id: id
            }, // Prisma sabe lidar com entidade fracas e deleta em cascata.
        });
    } else if (destino === "agendamentos") {
        resultDestino = await prisma.agendamento.delete({
            where: {
                remedio_id: id
            },
        });
    } else {
        throw new Error('Invalid route.')
    }
    return resultDestino;
}

export const handler = async (event) => {
    // n da pra deletar um remedio sem deletar o agendamento, mas da pra deletar um agendamento sem deletar o remedio
    const possibleRoutes = {
        '/medicamentos': 'medicamentos',
        '/agendamentos': 'agendamentos',
    };
    const rutaBase = event.rawPath || '';

    const stage = event.requestContext?.stage || '';
    const resource = rutaBase.split(`/${stage}/`)[1]?.split("/")[0];
    const destino = possibleRoutes[`/${resource}`] || null;

    const idParam = event.pathParameters?.id;
    const isIdNumber = idParam !== undefined && !isNaN(Number(idParam));
    const id = isIdNumber ? Number(idParam) : null;

    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid body or null Id.' }),
            headers: { "Content-Type": "application/json" },
        };
    }
    // ent se for /medicamentos, ele vai deletar o remedio e o agendamento. se for /agendamentos, ele vai deletar só o agendamento. porque agendamento é uma entidade fraca
    if (!destino) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: 'Rota inválida.',
                "route": rutaBase,
                "stage": stage,
                "resource": resource,
                "destino": destino
            }),
        };
    }

    try {
        const result = await deleteQuery(destino, id);
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