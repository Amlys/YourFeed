import { z } from 'zod';
import { 
  AppError, 
  Result, 
  createSuccess, 
  createError,
  ISO8601Date,
  createBrandedString
} from '../types/common';

// Service de validation centralisé
export class ValidationService {
  /**
   * Valide des données avec un schéma Zod et retourne un Result
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): Result<T> {
    try {
      const validatedData = schema.parse(data);
      return createSuccess(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = context 
          ? `Validation failed for ${context}: ${error.issues.map(i => i.message).join(', ')}`
          : `Validation failed: ${error.issues.map(i => i.message).join(', ')}`;
        
        const appError: AppError = {
          code: 'VALIDATION_ERROR',
          message: errorMessage,
          details: {
            zodError: error.issues,
            context,
            receivedData: data
          },
          timestamp: createBrandedString<'ISO8601Date'>(new Date().toISOString())
        };
        
        return createError(appError);
      }
      
      // Erreur non-Zod
      const appError: AppError = {
        code: 'UNKNOWN_VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        details: { error, context, receivedData: data },
        timestamp: createBrandedString<'ISO8601Date'>(new Date().toISOString())
      };
      
      return createError(appError);
    }
  }

  /**
   * Valide des données et throw une erreur en cas d'échec
   */
  static validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T {
    const result = this.validate(schema, data, context);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }

  /**
   * Valide une réponse API avec logging
   */
  static async validateApiResponse<T>(
    schema: z.ZodSchema<T>, 
    response: Response, 
    context: string
  ): Promise<Result<T>> {
    try {
      if (!response.ok) {
        const errorText = await response.text();
        const appError: AppError = {
          code: 'API_ERROR',
          message: `API request failed: ${response.status} ${response.statusText}`,
          details: { 
            status: response.status, 
            statusText: response.statusText, 
            response: errorText,
            context
          },
          timestamp: createBrandedString<'ISO8601Date'>(new Date().toISOString())
        };
        return createError(appError);
      }

      const jsonData = await response.json();
      console.info(`[ValidationService] Validating API response for ${context}`);
      
      const validationResult = this.validate(schema, jsonData, context);
      
      if (validationResult.success) {
        console.info(`[ValidationService] ✅ API response validation successful for ${context}`);
      } else {
        console.error(`[ValidationService] ❌ API response validation failed for ${context}:`, validationResult.error);
      }
      
      return validationResult;
      
    } catch (error) {
      console.error(`[ValidationService] ❌ Error processing API response for ${context}:`, error);
      
      const appError: AppError = {
        code: 'API_PROCESSING_ERROR',
        message: `Failed to process API response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error, context },
        timestamp: createBrandedString<'ISO8601Date'>(new Date().toISOString())
      };
      
      return createError(appError);
    }
  }

  /**
   * Valide un tableau d'éléments individuellement
   */
  static validateArray<T>(
    schema: z.ZodSchema<T>, 
    items: unknown[], 
    context?: string
  ): Result<T[]> {
    const validatedItems: T[] = [];
    const errors: AppError[] = [];

    for (let i = 0; i < items.length; i++) {
      const result = this.validate(schema, items[i], `${context}[${i}]`);
      if (result.success) {
        validatedItems.push(result.data);
      } else {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      const appError: AppError = {
        code: 'ARRAY_VALIDATION_ERROR',
        message: `Array validation failed: ${errors.length} out of ${items.length} items failed validation`,
        details: { 
          errors, 
          validatedCount: validatedItems.length, 
          totalCount: items.length,
          context 
        },
        timestamp: createBrandedString<'ISO8601Date'>(new Date().toISOString())
      };
      return createError(appError);
    }

    return createSuccess(validatedItems);
  }

  /**
   * Valide partiellement un tableau (accepte les erreurs)
   */
  static validateArrayPartial<T>(
    schema: z.ZodSchema<T>, 
    items: unknown[], 
    context?: string
  ): { validItems: T[]; errors: AppError[]; successRate: number } {
    const validatedItems: T[] = [];
    const errors: AppError[] = [];

    for (let i = 0; i < items.length; i++) {
      const result = this.validate(schema, items[i], `${context}[${i}]`);
      if (result.success) {
        validatedItems.push(result.data);
      } else {
        errors.push(result.error);
        console.warn(`[ValidationService] Item ${i} failed validation:`, result.error.message);
      }
    }

    const successRate = items.length > 0 ? validatedItems.length / items.length : 1;
    
    console.info(
      `[ValidationService] Array validation for ${context}: ${validatedItems.length}/${items.length} items valid (${Math.round(successRate * 100)}%)`
    );

    return { 
      validItems: validatedItems, 
      errors, 
      successRate 
    };
  }
}

// Helper functions pour faciliter l'utilisation
export const safeValidate = ValidationService.validate;
export const safeValidateOrThrow = ValidationService.validateOrThrow;
export const safeValidateApiResponse = ValidationService.validateApiResponse;
export const safeValidateArray = ValidationService.validateArray;
export const safeValidateArrayPartial = ValidationService.validateArrayPartial; 