export const handler = async function(event: any) {
  console.log(`Auth event:`, event);

  const token = event.authorizationToken?.split(' ').pop();

  if (!token || token === 'undefined' || token === 'null') {
    throw new Error('Unauthorized');
  }

  const buffer = Buffer.from(token, 'base64');
  const [userName, pass] = buffer.toString('utf-8').split('=');

  const envPassword = process.env?.[userName];

  const isAuth = pass && envPassword && pass === envPassword;

  console.log(`Authorization =>`, isAuth ? 'ALLOW' : 'DENY');
  
  return {
    principalId: 'user',
    policyDocument: {
        Version: '2012-10-17',
        Statement: [
        {
            Action: 'execute-api:Invoke',
            Effect: isAuth ? 'Allow' : 'Deny',
            Resource: event.methodArn,
        },
        ],
    },
  };
};
