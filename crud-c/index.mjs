import { Prisma, PrismaClient } from '@prisma/client';

/** @type {PrismaClient} */
let prisma;

if (!global.prisma) {
    global.prisma = new PrismaClient();;
}
/** @type {PrismaClient} */
prisma = global.prisma;

async function createQuery(destino, body) {
    try {
        const insertData = {
            nome: body.nome,
            principio_ativo: body.principio_ativo,
            concentracao: body.concentracao,
            forma_farmaceutica: body.forma_farmaceutica,
            estoque_inicial: body.estoque_inicial,
            observacoes: body.observacoes,
            descricao: body.descricao
        };


        const agendamentoData = body.agendamento ? {
            slot: body.agendamento.slot,
            remedio_id: body.agendamento.remedio_id,
            dosagem: body.agendamento.dosagem,
            data_inicio: new Date(body.agendamento.data_inicio),
            duracao_dias: body.agendamento.duracao_dias
        } : null;

        let resultDestino;
        if (destino === "medicamentos") {
            resultDestino = await prisma.remedio.create({
                data: insertData,
                select: { id: true }
            })
        } else if (destino === "agendamentos") {
            const isIdValid = await prisma.remedio.findUnique({
                where: { id: agendamentoData.remedio_id },
                select: { id: true }
            });

            if(!isIdValid){
                throw new Error("Id de remédio inexistente.")
            }

            resultDestino = await prisma.agendamento.create({
                data: {
                    ...agendamentoData
                },
            });
        } else {
            throw new Error('Rota inválida.');
        }
        return resultDestino;
    } catch (error) {
        console.error(error);
        if(error instanceof Prisma.PrismaClientKnownRequestError){
            if (error.code === 'P2002')
                throw new Error('Remédio já possui agendamento.');
            else if (error.code === 'P2003')
                throw new Error('Violação de chave estrangeira.');
            else if (error.code === 'P2004')
                throw new Error('Violação de constraint.');
        } else {
            throw error;
        }
        
    }
}

export const handler = async (event) => {
    const body = event.body ? JSON.parse(event.body) : {};

    if (Object.keys(body).length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Corpo de requisição inválido.' }),
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

    const rutaBase = event.rawPath + "";
    const stage = event.requestContext?.stage || '';
    const resource = rutaBase.split(`/${stage}/`)[1]?.replaceAll("/", "")

    const destino = possibleRoutes[`/${resource}`];


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
            body: JSON.stringify({ error: `Erro interno de servidor: ${error.message}` }),
            headers: { "Content-Type": "application/json" },
        };
    }
};
