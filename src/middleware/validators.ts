import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

// Helper que chequea si hay errores y corta la request
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Validaciones para register: email valido + password min 6 chars
export const registerValidators = [
  body('email')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('La password debe tener al menos 6 caracteres')
    .trim(),
];

// Validaciones para login: solo email valido (la longitud de la password ya no
// importa, supabase rechaza credenciales invalidas con 401).
export const loginValidators = [
  body('email')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
];

// Validaciones para actualizar perfil
export const updateProfileValidators = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres')
    .trim()
    .escape(),
  body('email')
    .optional()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
];

// Validaciones para agregar item al carrito
export const cartItemValidators = [
  body('product_id')
    .notEmpty().withMessage('product_id es requerido')
    .isString().trim(),
  body('quantity')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un numero entero mayor a 0'),
];

// Validaciones para actualizar quantity de un item existente
export const cartItemUpdateValidators = [
  body('quantity')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un numero entero mayor a 0'),
];

// Validaciones para crear lista
export const createListValidators = [
  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres')
    .trim()
    .escape(),
];

// Validaciones para item de lista
export const listItemValidators = [
  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .trim()
    .escape(),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un numero entero mayor a 0'),
];