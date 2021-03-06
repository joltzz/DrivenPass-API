import jwt, { Algorithm, SignOptions } from "jsonwebtoken";
import "../config/setup.js";
import { EMAIL_ALREADY_EXISTS, SIGN_IN_UNAUTHORIZED } from "../events/ErrosList.js";
import * as userRepository from "../repositories/userRepository.js";
import { internalBcrypt } from "../utils/encrypt.js";
import { env } from "../utils/env.js";

interface MainProperties {
  email: string;
  password: string;
}

export type SignUp = MainProperties;
export type SignIn = MainProperties;

export async function signUp(data: SignUp) {
  const { email, password } = data;
  const cryptPass = internalBcrypt.hashValue(password);

  await emailNotExist(email);
  await userRepository.insert({ email, password: cryptPass });
}

export async function signIn(data: SignIn) {
  const { email, password } = data;

  const user = await findUserByEmail(email);
  if (!internalBcrypt.compareSync(password, user.password)) {
    throw SIGN_IN_UNAUTHORIZED;
  }

  return jwtTokenGenerate(user.id);
}

function jwtTokenGenerate(id: number) {
  const data = { id };
  const subject = id.toString();
  const secretKey = env.JWT_SECRET;
  const expiresIn = env.JWT_EXPIRES_IN;
  const algorithm = env.JWT_ALGORITHM as Algorithm;

  const config: SignOptions = { algorithm, expiresIn, subject };
  const token = jwt.sign(data, secretKey, config);

  return token;
}

async function emailNotExist(email: string) {
  const user = await userRepository.findByEmail(email);
  if (user) {
    throw EMAIL_ALREADY_EXISTS;
  }
}

async function findUserByEmail(email: string) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw SIGN_IN_UNAUTHORIZED;
  }

  return user;
}