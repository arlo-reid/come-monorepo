"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getGetOrganisationsPagedHttpControllerHandleQueryKey,
  getGetOrganisationBySlugHttpControllerHandleQueryKey,
  useCreateOrganisationHttpControllerHandle,
  useGetOrganisationBySlugHttpControllerHandle,
} from "@/generated/organisations/organisations";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface OrganisationFormProps extends React.ComponentProps<typeof Card> {
  slug?: string;
  session?: Session | null;
  onSuccess?: () => void;
}

export function OrganisationForm({
  slug,
  session,
  onSuccess,
  ...props
}: OrganisationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mode = slug ? "edit" : "create";
  const [formData, setFormData] = useState({
    name: "",
  });

  // Fetch organisation data if in edit mode
  const { data: organisationData, isLoading: isLoadingOrganisation } =
    useGetOrganisationBySlugHttpControllerHandle(slug || "", {
      query: {
        enabled: !!slug,
        retry: false,
      },
    });

  // Populate form when organisation data loads
  useEffect(() => {
    if (organisationData?.data) {
      const organisation = organisationData.data;
      setFormData({
        name: organisation.name || "",
      });
    }
  }, [organisationData]);

  // Create organisation mutation
  const { mutate: createOrganisation, isPending: isCreating } =
    useCreateOrganisationHttpControllerHandle({
      mutation: {
        onSuccess: async () => {
          toast.success("Organisation created successfully");
          // Get the correct query key
          const queryKey = getGetOrganisationsPagedHttpControllerHandleQueryKey(
            {},
          );
          // Invalidate and refetch organisation queries
          await queryClient.invalidateQueries({
            queryKey,
          });
          // Wait for refetch to complete before navigating
          await queryClient.refetchQueries({
            queryKey,
          });
          // Call onSuccess callback if provided (for modal), otherwise navigate
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/admin/organisations");
          }
        },
        onError: (error: unknown) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to create organisation";
          toast.error(errorMessage);
        },
      },
    });

  // TODO: Add update organisation mutation when backend supports it
  // Currently the API only has create and delete, not update

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Organisation name is required");
      return;
    }

    if (mode === "create") {
      createOrganisation({
        data: {
          name: formData.name,
        },
      });
    } else {
      // TODO: Implement update when backend supports it
      toast.error("Update functionality not yet implemented");
    }
  };

  const isLoading = isCreating || isLoadingOrganisation;

  return (
    <Card {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {mode === "create" ? "Create Organisation" : "Edit Organisation"}
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Enter your organisation information below"
                : "Update your organisation information"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">
                Organisation Name <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <FieldDescription>Your organisation name</FieldDescription>
            </Field>

            <FieldGroup>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "create" ? "Creating..." : "Saving..."}
                  </>
                ) : mode === "create" ? (
                  "Create Organisation"
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
