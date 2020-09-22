import { Injectable } from '@nestjs/common'
import { UserRepository } from '../repository/user.repository'
import { UserDto } from '../dto/user.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { businessAssert } from '../lib/errors'
import { ValidationUtils } from '../utils/validation'
import { User } from '../entities/entity.user'
import { ObjectUtils } from '../utils/object'
import { WorkdayDto, WorkdayFilterDto } from '../dto/workday.dto'
import { WorkdayRepository } from '../repository/workday.repository'
import { ProviderAttribute } from '../app.interfaces'

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserRepository)
		private userRepository: UserRepository,
		@InjectRepository(WorkdayRepository)
		private workdayRepository: WorkdayRepository,
	) {
	}

	async getProfile(id: string) {
		return ObjectUtils.omit(await this.userRepository.findOne(id), ['salt', 'hash'])
	}

	async findByEmail(email: string): Promise<User> {
		const user = await this.userRepository.findOne({ where: { email } })

		businessAssert(user, `Unable to found user by email: ${email}`)

		return user
	}

	getIdsByProviderIdOrEmail(id, email, provider) {
		const providerAttribute = `${provider}Id` as ProviderAttribute

		return this.userRepository.findOne({
			where : [
				{ [`${provider}Id`]: id },
				{ email: email || undefined },
			],
			select: ['id', providerAttribute],
		})
	}

	ensureUniqueUser(email: string) {
		return this.userRepository.ensureUniqueUser('email', email)
	}

	createProfile(user: User) {
		return this.userRepository.createProfile(user)
	}

	markWorkingDay(user, dto: WorkdayDto) {
		return this.workdayRepository.markWorkingDay(user, dto)
	}

	findUsersByBusyness(filter: WorkdayFilterDto) {
		return this.userRepository.findUsersByBusyness(filter)
	}

	async updateProfile(id: string, data: UserDto) {
		ValidationUtils.validateDTO(data, this.userRepository.publicAttributes)

		await this.userRepository.update({ id }, data)

		return data
	}

	updateProviderId(id, provider, providerId) {
		return this.userRepository.update({ id }, { [`${provider}Id`]: providerId })
	}
}