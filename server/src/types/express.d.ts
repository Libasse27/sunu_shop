/* eslint-disable @typescript-eslint/no-namespace */
declare namespace Express {
  interface Request {
    user?: import('../models/User.model').IUser & { _id: import('mongoose').Types.ObjectId };
  }
}
