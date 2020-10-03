import { EntityRepository, Repository } from 'typeorm'
import { User } from '../entities/entity.user'
import { WorkdayFilterDto } from '../dto/workday.dto'
import { WorkDay } from '../entities/entity.work.day'
import { DateUtils } from '../utils/date'
import { Injectable } from '@nestjs/common'
import { ArrayUtils } from '../utils/ArrayUtils'

@Injectable()
@EntityRepository(User)
export class UserRepository extends Repository<User> {
	public publicAttributes = [
		'yearCommercialExp',
		'phone',
		'musicalInstrument',
		'imageUrl',
		'name',
		'dob',
		'city',
		'email',
		'gender',
		'type',
	]
	// props ? ArrayUtils.intersection(this.publicAttributes, []) :
	private readonly selectStatement = this.publicAttributes.map(attr => `"${attr}"`).join(',')

	async ensureUniqueUser(attribute, value) {
		return !(await this.count({ where: { [attribute]: value } }))
	}

	async createProfile(user: User): Promise<string> {
		const { identifiers: [{ id }] } = await this.insert(user)

		return id
	}

	getProfile(id, props) {
		props = props && props.split(',')

		return this.findOne({
			where: { id },
			select: ['id'].concat(props
				? ArrayUtils.intersection(this.publicAttributes, props)
				: this.publicAttributes) as any,
		})
	}

	findUsersByBusyness(filter: WorkdayFilterDto) {
		const now = new Date()

		return this.createQueryBuilder('user')
			.select(this.selectStatement)
			.innerJoin(WorkDay, 'workdays',  'user.id="workdays"."userId"')
			.where(`"musicalInstrument" ${filter.musicalInstrument ? '= :musicalInstrument' : 'IS NOT NULL'}`, {
				musicalInstrument: filter.musicalInstrument,
			})
			.andWhere('workdays.date BETWEEN :from AND :to', {
				from: filter.from || DateUtils.addDays(now, -1),
				to: filter.to || DateUtils.addDays(now, 1),
			})
			.andWhere('type = :userType', { userType: filter.userType })
			.andWhere('"workdays"."dayOff" = :dayOff', { dayOff: filter.dayOff })
			.groupBy('user.id')
			.execute()
	}
}