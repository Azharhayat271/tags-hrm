'use client';

import { useCallback } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ApiResponse<T = any> {
  success?: boolean;
  error?: boolean;
  code?: string;
  message?: string;
  data?: T;
}

export function useApiCall() {
  const router = useRouter();
  const supabase = createClient();

  const callApi = useCallback(
    async <T = any,>(
      endpoint: string,
      options: {
        method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
        body?: any;
        headers?: Record<string, string>;
      } = {}
    ): Promise<{ data?: T; error?: string }> => {
      try {
        // Get auth session to get JWT token
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          return { error: "Not authenticated. Please log in." };
        }

        // Check if body is FormData
        const isFormData = options.body instanceof FormData;

        // Build headers - don't set Content-Type for FormData (browser will set it with boundary)
        const headers: Record<string, string> = {
          Authorization: `Bearer ${session.access_token}`,
          ...options.headers,
        };

        if (!isFormData) {
          headers["Content-Type"] = "application/json";
        }

        const response = await fetch(endpoint, {
          method: options.method || "GET",
          headers,
          body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
        });

        const result: ApiResponse<T> = await response.json();

        if (!response.ok) {
          return {
            error: result.message || "An error occurred",
          };
        }

        return { data: result.data };
      } catch (error) {
        console.error("API call error:", error);
        return {
          error: error instanceof Error ? error.message : "An error occurred",
        };
      }
    },
    [supabase, router]
  );

  return { callApi };
}
