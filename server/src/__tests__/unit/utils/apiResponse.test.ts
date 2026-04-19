import { ApiResponse } from '../../../utils/ApiResponse';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ApiResponse', () => {
  describe('success()', () => {
    it('répond 200 avec success:true', () => {
      const res = mockRes();
      ApiResponse.success(res, { id: 1 }, 'OK');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'OK', data: { id: 1 } })
      );
    });

    it('répond 200 avec données null', () => {
      const res = mockRes();
      ApiResponse.success(res, null);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: null })
      );
    });
  });

  describe('created()', () => {
    it('répond 201', () => {
      const res = mockRes();
      ApiResponse.created(res, { id: 'new' }, 'Créé');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 'new' } })
      );
    });
  });

  describe('paginated()', () => {
    it('inclut les métadonnées de pagination', () => {
      const res = mockRes();
      const pagination = { page: 1, limit: 10, total: 50, totalPages: 5 };
      ApiResponse.paginated(res, [], pagination);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, pagination })
      );
    });
  });
});
