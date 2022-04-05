import Hash from '@ioc:Adonis/Core/Hash'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class AuthController {
  // Register User
  public async register({ request, response, auth }: HttpContextContract) {
    const { username, password } = request.all()

    const newUserSchema = schema.create({
      username: schema.string({ trim: true }, [
        rules.unique({ table: 'users', column: 'username' }),
        rules.minLength(3),
      ]),
      password: schema.string({ trim: true }, [rules.required(), rules.minLength(6)]),
    })

    const payload = await request.validate({ schema: newUserSchema })
    console.log(payload)
    // Create a new user model instance
    const user = await User.create({
      username,
      password,
    })

    // Return the token alongside the user
    return response.json({
      user,
    })
  }

  // Login User
  public async login({ request, response, auth }: HttpContextContract) {
    const { username, password } = request.all()

    const loginSchema = schema.create({
      username: schema.string({ trim: true }, [rules.required()]),
      password: schema.string({ trim: true }, [rules.required()]),
    })

    const payload = await request.validate({ schema: loginSchema })
    console.log(payload)
    // Find the user by username
    const user = await User.findBy('username', username)
    if (!user) {
      return response.status(401).json({
        error: 'Username or password is incorrect',
      })
    }

    // Validate the user password
    console.log('user Password', user.password)
    const isValid = await Hash.verify(user.password, password)
    if (!isValid) {
      return response.status(401).json({
        error: 'Username or password is incorrect',
      })
    }

    // Generate a token for the user
    const token = await auth.use('api').generate(user)

    // Return the token alongside the user
    return response.json({
      user,
      token,
    })
  }

  public async check({ request, response, auth }: HttpContextContract) {
    const user = await auth.isLoggedIn
    return response.json({
      user,
    })
  }

  public async logout({ request, response, auth }: HttpContextContract) {
    await auth.logout()
    return response.json({
      message: 'Successfully logged out',
    })
  }
}
