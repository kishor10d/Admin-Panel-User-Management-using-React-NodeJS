import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { queryClient } from '../lib/query-client';
import { store } from './store';
import { ToastProvider } from './toast-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    </ToastProvider>
  );
}
