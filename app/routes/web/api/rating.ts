import { json, redirect } from '@remix-run/node'
import { db } from '~/lib/db/db.server'
import { rating } from '~/lib/db/schema/rating'
import { eq, and } from 'drizzle-orm'
import { auth } from '~/lib/auth/auth.server'

export async function action({ request }: { request: Request }) {
	const session = await auth.api.getSession(request)
	if (!session) throw redirect('/auth')

	const user = session.user
	const formData = await request.formData()
	const restaurantId = formData.get('restaurantId')?.toString()
	const score = Number(formData.get('score'))

	// 只能評一次
	const exists = await db.query.rating.findFirst({
		where: (r, { eq, and }) => and(
			eq(r.restaurantId, restaurantId),
			eq(r.userId, user.id)
		),
	})
	if (exists) {
		return json({ error: '你已經評分過了' }, { status: 400 })
	}

	const result = await db.insert(rating).values({
		userId: user.id,
		restaurantId,
		score,
	}).returning()

	return json({ msg: '評分成功', rating: result[0] })
}
