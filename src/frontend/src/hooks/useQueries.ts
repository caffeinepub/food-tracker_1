import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FoodDonation,
  backendInterface as FullBackend,
  Stats,
  Tip,
  WasteEntry,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetMyWasteEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<WasteEntry[]>({
    queryKey: ["wasteEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyWasteEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStats() {
  const { actor, isFetching } = useActor();
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor)
        return {
          totalWasteThisWeek: 0,
          totalWasteThisMonth: 0,
          mostWastedFood: "-",
          totalWaste: 0,
        };
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTips() {
  const { actor, isFetching } = useActor();
  return useQuery<Tip[]>({
    queryKey: ["tips"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTips();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddWasteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      foodName: string;
      quantity: number;
      reason: string;
      mealType: string;
      date: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addWasteEntry(
        entry.foodName,
        entry.quantity,
        entry.reason,
        entry.mealType,
        entry.date,
        entry.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wasteEntries"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteWasteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteWasteEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wasteEntries"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useAddFoodDonation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (donation: {
      foodName: string;
      quantity: number;
      unit: string;
      location: string;
      pickupWindow: string;
      contact: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as FullBackend;
      return a.addFoodDonation(
        donation.foodName,
        donation.quantity,
        donation.unit,
        donation.location,
        donation.pickupWindow,
        donation.contact,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDonations"] });
      queryClient.invalidateQueries({ queryKey: ["availableDonations"] });
    },
  });
}

export function useGetAvailableDonations() {
  const { actor, isFetching } = useActor();
  return useQuery<FoodDonation[]>({
    queryKey: ["availableDonations"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as FullBackend;
      return a.getAvailableDonations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyDonations() {
  const { actor, isFetching } = useActor();
  return useQuery<FoodDonation[]>({
    queryKey: ["myDonations"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as FullBackend;
      return a.getMyDonations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimDonation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as FullBackend;
      return a.claimDonation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availableDonations"] });
    },
  });
}

export function useMarkCollected() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as FullBackend;
      return a.markCollected(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDonations"] });
      queryClient.invalidateQueries({ queryKey: ["availableDonations"] });
    },
  });
}
