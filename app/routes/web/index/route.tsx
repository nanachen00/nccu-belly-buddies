import {
	redirect,
	useLoaderData,
	type ClientLoaderFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from 'react-router'

import { MainWrapper } from '~/components/wrappers'
import { auth } from '~/lib/auth/auth.server'
import { getSEO } from '~/lib/db/seo.server'
import { createMeta } from '~/lib/utils/seo'

import { Footer } from '../components/footer'
import { Nav } from '../components/nav'
import { Hero } from './hero'

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
	if (!data || !data.meta) {
		return []
	}

	return data.meta.metaTags
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { seo } = await getSEO(new URL(request.url).pathname)
	const meta = seo ? createMeta(seo, new URL(request.url)) : null

	const session = await auth.api.getSession({
		headers: request.headers,
	})

	if (!session) {
		console.log('No session found, redirecting to auth')
		return redirect('/auth')
	} else {
		console.log('Session found, redirecting to dashboard')
	}

	try {
		return { meta }
	} catch (error) {
		console.error(error)
		return { meta }
	}
}

let cache: Awaited<ReturnType<typeof loader>>
export const clientLoader = async ({
	serverLoader,
}: ClientLoaderFunctionArgs) => {
	if (cache) {
		return cache
	}

	cache = await serverLoader()
	return cache
}

clientLoader.hydrate = true

export default function Index() {
	const { meta } = useLoaderData<typeof loader>()

	return (
		<>
			<Nav />

			<MainWrapper>
				<h1 className="visually-hidden">{meta?.seo.metaTitle}</h1>
				<Hero />
				<Footer />
			</MainWrapper>
		</>
	)
}
