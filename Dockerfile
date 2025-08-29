FROM public.ecr.aws/lambda/nodejs:18

WORKDIR "${LAMBDA_TASK_ROOT}"

# crud-c, crud-r, crud-u, crud-d
ARG PROJECT_DIR

COPY package.json package-lock.json ./

COPY schema.prisma ./

RUN npm install --omit=dev

COPY ${PROJECT_DIR}/index.mjs ./

CMD [ "index.handler" ]