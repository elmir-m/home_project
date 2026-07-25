"use client";

import Modal from "@/components/modal";

type Member = {
  user_id: string;
  role: string;
  profiles: {
    display_name: string | null;
    email: string | null;
    avatar_url?: string | null;
  } | null;
};

export default function MemberDetail({
  member,
  householdName,
}: {
  member: Member;
  householdName: string | null;
}) {
  const name = member.profiles?.display_name ?? member.profiles?.email ?? "?";
  const email = member.profiles?.email ?? "";
  const avatar = member.profiles?.avatar_url ?? null;
  const initial = name.charAt(0).toUpperCase();
  const isOwner = member.role === "owner";

  const Avatar = ({ size }: { size: string }) =>
    avatar ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar} alt={name} className={`${size} rounded-full object-cover`} />
    ) : (
      <span
        className={`${size} flex items-center justify-center rounded-full bg-indigo-600 font-semibold text-white`}
      >
        {initial}
      </span>
    );

  return (
    <Modal
      title="Profil člana"
      trigger={(open) => (
        <button
          onClick={open}
          className="flex flex-1 items-center gap-3 text-left"
          title="Prikaži profil"
        >
          <Avatar size="h-9 w-9 text-sm" />
          <span className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            {name}
          </span>
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar size="h-20 w-20 text-2xl" />
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {name}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isOwner
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
            >
              {isOwner ? "vlasnik" : "član"}
            </span>
            {householdName && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-[#2a2f39] dark:text-zinc-300">
                {householdName}
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
