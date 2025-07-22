
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {signup} from "../lib/api"

const useSignup = () => {
    const queryClient = useQueryClient();

  const { 
    mutate,
    isPending,
    error } = useMutation({
    mutationFn: signup,

    // ✅ Refetch auth user query after signup is successful
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  return {error, isPending, signupMutation:mutate};
}

export default useSignup