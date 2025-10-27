FROM oraclelinux:7-slim

# Instalar dependências e limpar cache
RUN yum update -y && \
    yum install -y oracle-release-el7 && \
    yum install -y oracle-nodejs-release-el7 && \
    yum install -y nodejs && \
    yum install -y oracle-instantclient19.3-basic.x86_64 && \
    yum clean all

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]