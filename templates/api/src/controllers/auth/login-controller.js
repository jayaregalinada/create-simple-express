
const FAKE_USER = {
  email: 'admin',
  password: 'password'
}
const SIMULATED_DELAY_MS = 2000;

/**
 * Simulates an asynchronous sign-in process with fake credentials and returns a fake token.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<{ message: string, user: { email: string, name: string }, token: string }>} A promise resolving with user info and token.
 */
async function fakeSignIn(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email !== FAKE_USER.email && password !== FAKE_USER.password) {
        reject(new Error('Invalid credentials'));
      }

      const fakeToken = Buffer.from(`${email}:FAKE_TOKEN`).toString("base64")

      resolve({ message: 'Signin successful!', user: { email, name: 'Fake User' }, token: fakeToken})
    }, SIMULATED_DELAY_MS)
  })
}

/**
 * Express controller for handling user login.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<import('express').Response>} The response with user welcome message or error.
 */
export async function loginController(req, res) {
  const { email, password } = req.body;

  try {
    const { user, token } = await fakeSignIn(email, password);

    return res.status(200).json({
      message: `Welcome, ${user.name}`,
      token,
    });
  } catch (error) {
    return res.status(401).json({
      error: error.message,
    });
  }
}