import { PrismaClient } from '@prisma/client';

/** @type {PrismaClient} */
let prisma;

if (!global.prisma) {
    global.prisma = new PrismaClient();;
}
/** @type {PrismaClient} */
prisma = global.prisma;

async function createQuery(destino, body) {
    let resultDestino;
    if (destino === "medicamentos") {
        resultDestino = await prisma.remedio.create({
            data: body,
            select: { id: true }
        })
    } else if (destino === "agendamentos") {
        resultDestino = await prisma.agendamento.create({
            data: body,
            select: { remedio_id: true }
        });
    } else if (destino === "root") {
        const { slot, dosagem, data_inicio, duracao_dias, ...remedioData } = body;
        const agendamentoData = { slot, dosagem, data_inicio, duracao_dias };

        const resultRemedio = await prisma.remedio.create({
            data: remedioData, 
            select: { id: true }
        });
        const resultAgendamento = await prisma.agendamento.create({
            data: {
                remedio_id: resultRemedio.id,
                ...agendamentoData 
            },
        });

        resultDestino = {resultRemedio, resultAgendamento};
    } else {
        throw new Error('Invalid route.');
    }
    return resultDestino;
}

export const handler = async (event) => {
    const body = event.body ? JSON.parse(event.body) : {};

    if (Object.keys(body).length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid body.' }),
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
        '/': 'root'
    };
    const rutaBase = event.path === '/' ? '/' : `/${event.path.split('/')[1]}`;
    const destino = possibleRoutes[rutaBase];


    if (!destino) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid route.' }),
            headers: { "Content-Type": "application/json" },
        };
    }

    try {
        const result = await createQuery(destino, body);
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
