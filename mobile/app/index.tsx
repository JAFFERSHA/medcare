import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Starting MedCare..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(main)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
