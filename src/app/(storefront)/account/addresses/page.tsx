import { listAddresses } from "@/server/actions/address.actions";
import { AddressCard } from "@/components/storefront/address-card";
import { AddressFormDialog } from "@/components/storefront/address-form-dialog";

export default async function AddressesPage() {
  const addresses = await listAddresses();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Your addresses</h1>
        <AddressFormDialog />
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-slate-500">
          You haven&apos;t added any addresses yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard key={address.id} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
