import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, authApi, catalogApi, equipmentApi, reservationApi } from '../api/services';

// Query keys live in one place so invalidation after a mutation never drifts from the queries.
export const keys = {
  catalog: ['catalog'],
  mine: (kind) => ['me', kind],
  availability: (params) => ['availability', params],
  installation: ['installation'],
  managerEquipment: ['manager', 'equipment'],
  managerReservations: (status) => ['manager', 'reservations', status || 'all'],
  adminStores: ['admin', 'stores'],
  adminUsers: (role) => ['admin', 'users', role || 'all'],
  adminReservations: (filters) => ['admin', 'reservations', filters],
};

// ---- queries ----------------------------------------------------------------

export const useInstallationStatus = () =>
  useQuery({ queryKey: keys.installation, queryFn: authApi.installationStatus, retry: false });

export const useCatalog = () =>
  useQuery({ queryKey: keys.catalog, queryFn: catalogApi.stores, staleTime: 60_000 });

// id -> { name, storeName }: lets history and manager tables show names the API only returns as ids.
export function useEquipmentIndex() {
  const { data: stores } = useCatalog();
  return useMemo(() => {
    const index = new Map();
    (stores || []).forEach((store) =>
      (store.equipment || []).forEach((item) => index.set(String(item._id || item.id), { name: item.name, storeName: store.name }))
    );
    return index;
  }, [stores]);
}

export const useMyReservations = (kind) =>
  useQuery({ queryKey: keys.mine(kind), queryFn: () => reservationApi.mine(kind) });

export const useAvailability = (params, enabled) =>
  useQuery({
    queryKey: keys.availability(params),
    queryFn: () => reservationApi.availability(params),
    enabled,
    retry: false,
    staleTime: 0,
  });

export const useManagerEquipment = () =>
  useQuery({ queryKey: keys.managerEquipment, queryFn: equipmentApi.list });

export const useManagerReservations = (status) =>
  useQuery({ queryKey: keys.managerReservations(status), queryFn: () => reservationApi.forManager(status) });

export const useAdminStores = () => useQuery({ queryKey: keys.adminStores, queryFn: adminApi.stores });

export const useAdminUsers = (role) =>
  useQuery({ queryKey: keys.adminUsers(role), queryFn: () => adminApi.users(role) });

export const useAdminReservations = (filters) =>
  useQuery({ queryKey: keys.adminReservations(filters), queryFn: () => reservationApi.forAdmin(filters) });

// ---- mutations --------------------------------------------------------------
// Each mutation invalidates the queries whose data it changes, so screens refetch on their own.

function useInvalidatingMutation(mutationFn, invalidate) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

const RESERVATION_KEYS = [['me'], ['availability'], ['manager', 'reservations'], ['admin', 'reservations']];
const EQUIPMENT_KEYS = [['manager', 'equipment'], ['catalog'], ['availability']];

export const useCreateReservation = () => useInvalidatingMutation(reservationApi.create, RESERVATION_KEYS);
export const useCancelReservation = () => useInvalidatingMutation(reservationApi.cancel, RESERVATION_KEYS);
export const useHandover = () => useInvalidatingMutation(reservationApi.handover, RESERVATION_KEYS);
export const useReturnItem = () => useInvalidatingMutation(reservationApi.returnItem, RESERVATION_KEYS);

export const useCreateEquipment = () => useInvalidatingMutation(equipmentApi.create, EQUIPMENT_KEYS);
export const useUpdateEquipment = () => useInvalidatingMutation(equipmentApi.update, EQUIPMENT_KEYS);
export const useRetireEquipment = () => useInvalidatingMutation(equipmentApi.retire, EQUIPMENT_KEYS);

const STORE_KEYS = [['admin', 'stores'], ['catalog']];
export const useCreateStore = () => useInvalidatingMutation(adminApi.createStore, STORE_KEYS);
export const useUpdateStore = () => useInvalidatingMutation(adminApi.updateStore, STORE_KEYS);
export const useDeactivateStore = () => useInvalidatingMutation(adminApi.deactivateStore, STORE_KEYS);

export const useCreateUser = () => useInvalidatingMutation(adminApi.createUser, [['admin', 'users']]);
export const useAssignStore = () => useInvalidatingMutation(adminApi.assignStore, [['admin', 'users']]);
