import fastify from 'fastify';
import axios from 'axios';
import cors from '@fastify/cors';
import 'dotenv/config';

const server = fastify({
    logger: true,
});

await server.register(cors, { origin: '*' });

server.route({
    method: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'],
    url: '/*',
    handler: (req, res) => {
        const { originalUrl, method, body: data, headers } = req;

        if (originalUrl === '/favicon.ico') {
            return res.status(204).send();
        }

        const [path, querieParams] = req.originalUrl.split('?');
        const serviceKey = path.split('/')[1];
        const paramsObj = {};

        if (querieParams) {
          const params = new URLSearchParams(querieParams);
          for (const [key, value] of params.entries()) {
            paramsObj[key] = value;
          }
        }

        if (serviceKey !== 'cart' && serviceKey !== 'product') {
            return res.status(502).send({ error: 'Bad Gateway. Cannot process request' });
          }

        const apiHost = process.env[`${serviceKey}_api`.toUpperCase()];

        let url = `${apiHost}/${serviceKey}s`;

        if(paramsObj.id) {
          url += `/${paramsObj.id}`
        }

        axios({
            url,
            data,
            method,
            headers: { 'Authorization': headers.authorization },
            timeout: 3000,
            responseType: 'json'
          }).then((resp) => {
            const { status, data } = resp;

            res.status(status).send(data);
          }).catch((e) => {
            const status = e?.response ? e?.response.status : 500;
            const data = e?.response ? e?.response.data : 'Something went wrong...';

            res.status(status).send(data)
          });
  }
});

const servise = async () => {
    try {
        await server.listen({ port: process.env.PORT || 3125, host: '0.0.0.0' })
    } catch (e) {
        server.log.error(e);
        process.exit(1);
    }
};

servise();
