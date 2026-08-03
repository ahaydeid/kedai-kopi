import { redirect } from 'next/navigation'

export default async function CustomerHomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const meja = params?.meja ? String(params.meja) : ''
  if (meja) {
    redirect(`/menu?meja=${encodeURIComponent(meja)}`)
  }
  redirect('/menu')
}
