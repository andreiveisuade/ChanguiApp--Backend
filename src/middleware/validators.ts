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

// Validaciones para register: email valido + password min 6 chars + name requerido
export const registerValidators = [
  body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La password debe tener al menos 6 caracteres')
    .trim(),
  body('name').trim().notEmpty().withMessage('El nombre es requerido').escape(),
];

// Validaciones para login: email valido + password requerida (supabase rechaza
// credenciales invalidas con 401, pero el password no puede faltar).
export const loginValidators = [
  body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

// Validaciones para actualizar perfil. Alineadas con los campos que persiste
// user.service (ALLOWED_FIELDS: full_name, avatar_url).
export const updateProfileValidators = [
  body('full_name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres')
    .trim()
    .escape(),
  body('avatar_url')
    // nullable: avatar_url = null es válido (sin avatar / borrar avatar). El
    // .optional() pelado solo ignora undefined, no null, y haría fallar .isURL().
    .optional({ nullable: true })
    .isURL()
    .withMessage('avatar_url debe ser una URL valida'),
];

// Validaciones para agregar item al carrito
export const cartItemValidators = [
  body('product_id').notEmpty().withMessage('product_id es requerido').isString().trim(),
  body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser un numero entero mayor a 0'),
  body('unit_price').isFloat({ gt: 0 }).withMessage('unit_price es requerido y debe ser mayor a 0'),
];

// Validaciones para actualizar quantity de un item existente
export const cartItemUpdateValidators = [
  body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser un numero entero mayor a 0'),
];
