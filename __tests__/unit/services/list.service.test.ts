import * as listRepository from '../../../src/repositories/list.repository';
import * as listService from '../../../src/services/list.service';
import { validList, validListItem } from '../../helpers/testData';

jest.mock('../../../src/repositories/list.repository');

const mockedRepo = listRepository as jest.Mocked<typeof listRepository>;
const USER = 'user-uuid-1';

describe('list.service', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getLists', () => {
    it('devuelve las listas del usuario', async () => {
      mockedRepo.findAllByUserId.mockResolvedValue([validList] as never);
      const result = await listService.getLists(USER);
      expect(result).toEqual([validList]);
      expect(mockedRepo.findAllByUserId).toHaveBeenCalledWith(USER);
    });
  });

  describe('getList', () => {
    it('devuelve la lista con items si es del usuario', async () => {
      mockedRepo.findByIdAndUser.mockResolvedValue({ ...validList, items: [validListItem] } as never);
      const result = await listService.getList(USER, validList.id);
      expect(result.items).toHaveLength(1);
    });

    it('404 si no existe o no es del usuario', async () => {
      mockedRepo.findByIdAndUser.mockResolvedValue(null);
      await expect(listService.getList(USER, 'x')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('createList', () => {
    it('crea con el name dado', async () => {
      mockedRepo.createList.mockResolvedValue(validList as never);
      const r = await listService.createList(USER, 'Compras');
      expect(mockedRepo.createList).toHaveBeenCalledWith(USER, 'Compras');
      expect(r).toEqual(validList);
    });

    it('crea con name null si no se pasa', async () => {
      mockedRepo.createList.mockResolvedValue(validList as never);
      await listService.createList(USER, null);
      expect(mockedRepo.createList).toHaveBeenCalledWith(USER, null);
    });
  });

  describe('renameList', () => {
    it('renombra', async () => {
      mockedRepo.updateList.mockResolvedValue({ ...validList, name: 'Nueva' } as never);
      const r = await listService.renameList(USER, validList.id, 'Nueva');
      expect(r.name).toBe('Nueva');
    });

    it('404 si la lista no es del usuario', async () => {
      mockedRepo.updateList.mockResolvedValue(null);
      await expect(listService.renameList(USER, 'x', 'y')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('deleteList', () => {
    it('borra', async () => {
      mockedRepo.deleteList.mockResolvedValue(validList as never);
      const r = await listService.deleteList(USER, validList.id);
      expect(r).toEqual(validList);
    });

    it('404 si la lista no es del usuario', async () => {
      mockedRepo.deleteList.mockResolvedValue(null);
      await expect(listService.deleteList(USER, 'x')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('addItem', () => {
    it('agrega el item si la lista es del usuario', async () => {
      mockedRepo.findByIdAndUser.mockResolvedValue(validList as never);
      mockedRepo.addItem.mockResolvedValue(validListItem as never);
      const r = await listService.addItem(USER, validList.id, { product_name: 'Leche' });
      expect(mockedRepo.addItem).toHaveBeenCalledWith(validList.id, { product_name: 'Leche' });
      expect(r).toEqual(validListItem);
    });

    it('404 y NO agrega si la lista no es del usuario', async () => {
      mockedRepo.findByIdAndUser.mockResolvedValue(null);
      await expect(
        listService.addItem(USER, 'x', { product_name: 'Leche' })
      ).rejects.toMatchObject({ status: 404 });
      expect(mockedRepo.addItem).not.toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('actualiza el tachado (purchased)', async () => {
      mockedRepo.findByIdAndUser.mockResolvedValue(validList as never);
      mockedRepo.updateItem.mockResolvedValue({ ...validListItem, purchased: true } as never);
      const r = await listService.updateItem(USER, validList.id, validListItem.id, { purchased: true });
      expect(r.purchased).toBe(true);
    });

    it('404 si el item no existe en la lista', async () => {
      mockedRepo.findByIdAndUser.mockResolvedValue(validList as never);
      mockedRepo.updateItem.mockResolvedValue(null);
      await expect(
        listService.updateItem(USER, validList.id, 'x', { purchased: true })
      ).rejects.toMatchObject({ status: 404 });
    });

    it('404 si la lista no es del usuario', async () => {
      mockedRepo.findByIdAndUser.mockResolvedValue(null);
      await expect(listService.updateItem(USER, 'x', 'y', {})).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('deleteItem', () => {
    it('borra el item', async () => {
      mockedRepo.findByIdAndUser.mockResolvedValue(validList as never);
      mockedRepo.deleteItem.mockResolvedValue(validListItem as never);
      const r = await listService.deleteItem(USER, validList.id, validListItem.id);
      expect(r).toEqual(validListItem);
    });

    it('404 si el item no existe', async () => {
      mockedRepo.findByIdAndUser.mockResolvedValue(validList as never);
      mockedRepo.deleteItem.mockResolvedValue(null);
      await expect(
        listService.deleteItem(USER, validList.id, 'x')
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
