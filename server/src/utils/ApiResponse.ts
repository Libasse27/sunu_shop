import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any = null, message = 'Succès', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res: Response, data: any, message = 'Créé avec succès') {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static paginated(res: Response, data: any[], pagination: any, message = 'Succès') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }

  static error(res: Response, message: string, statusCode = 500, errors?: any[]) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}
