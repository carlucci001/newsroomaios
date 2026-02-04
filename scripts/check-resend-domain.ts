const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function checkResendDomain() {
  const response = await fetch('https://api.resend.com/domains/ca3a24f9-191f-4a0b-88cf-8217b51c21a1', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

checkResendDomain();
