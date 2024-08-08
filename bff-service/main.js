import fastify from 'fastify';
import axios from 'axios';
import 'dotenv/config';

const server = fastify({
    logger: true,
});

server.route({
    method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    url: '/*',
    handler: (req, res) => {
        const request = {
            'originalUrl': req.originalUrl,
            'method': req.method,
            'body': req.body ?? null
        }

        console.info( 'request', request);

        axios({
            url: 'https://test.com/test',
            method: 'get',
            params: {
              userId: 111
            },
            headers: {
              'Authorization': 'Bearer testToken'
            },
            timeout: 3000,
            responseType: 'json'
          }).then(resp => {
            console.log('DATA', resp.data);
          }).catch(error => {
            console.error('API request error', error);
          });

        res.send(request);
  }
});

const servise = async () => {
    try {
        await server.listen({ port: process.env.PORT || 3000 })
    } catch (e) {
        server.log.error(e);
        process.exit(1);
    }
};

servise();
