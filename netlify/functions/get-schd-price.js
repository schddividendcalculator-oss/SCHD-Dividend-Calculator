exports.handler = async (event, context) => {
  const apiKey = process.env.Finhub_API;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key is not configured.' }),
    };
  }

  const symbol = 'SCHD';
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Finnhub API error: ${response.status} ${errorText}`);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch price from data provider.' }),
      };
    }

    const data = await response.json();

    // 'c' is the current price from Finnhub
    if (typeof data.c !== 'number' || data.c <= 0) {
      console.error('Invalid price data received from Finnhub:', data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Received invalid price data.' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ price: data.c }),
    };
  } catch (error) {
    console.error('Error fetching from Finnhub:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal error occurred.' }),
    };
  }
};
