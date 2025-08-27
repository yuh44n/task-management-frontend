import { useToast as useVueToast } from 'vue-toastification';

export default function useToast() {
  const toast = useVueToast();
  return toast;
}