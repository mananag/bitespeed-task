import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { CreateContactDTO } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async createContact(createContactDTO: CreateContactDTO) {
    const { email, phoneNumber } = createContactDTO;
    if (!email && !phoneNumber) {
      throw new BadRequestException('Email and Phone number is required');
    }

    let primaryContact: Contact | null = null;
    const matchedContacts = await this.contactRepository.find({
      where: [{ email }, { phoneNumber }],
      order: {
        createdAt: 'ASC',
      },
    });
    // console.log(matchedContacts);

    if (matchedContacts.length && !matchedContacts[0].linkedId) {
      primaryContact = matchedContacts[0];
    } else if (matchedContacts.length && matchedContacts[0].linkedId) {
      primaryContact = await this.contactRepository.findOne({
        where: [{ linkedId: matchedContacts[0].linkedId }],
      });
    }

    if (!primaryContact) {
      const newPrimaryContact = this.contactRepository.create({
        ...createContactDTO,
      });
      await this.contactRepository.save(newPrimaryContact);
      return {
        contact: {
          primaryContactId: newPrimaryContact.id,
          emails: [newPrimaryContact.email],
          phoneNumbers: [newPrimaryContact.phoneNumber],
          secondaryContactIds: [],
        },
      };
    }

    await Promise.all(
      matchedContacts.map(async (matchedContact: Contact) => {
        if (
          matchedContact.id !== primaryContact.id &&
          matchedContact.linkPrecedence !== 'secondary'
        ) {
          matchedContact.linkPrecedence = 'secondary';
          matchedContact.linkedId = primaryContact.id;
          return await this.contactRepository.save(matchedContact);
        }
      }),
    );

    const secondaryContacts = await this.contactRepository.find({
      where: [{ linkedId: primaryContact?.id }],
    });

    if (email && phoneNumber) {
      const emailMatchedContacts = await this.contactRepository.count({
        where: { email },
      });
      const numberMatchedContacts = await this.contactRepository.count({
        where: { phoneNumber },
      });
      if (!(emailMatchedContacts && numberMatchedContacts)) {
        let contact = await this.contactRepository.findOne({
          where: { email, phoneNumber },
        });

        contact = contact
          ? contact
          : this.contactRepository.create({
              email,
              phoneNumber,
              linkPrecedence: 'secondary',
              linkedId: primaryContact?.id,
            });
        await this.contactRepository.save(contact);
        secondaryContacts.push(contact);
      }
    }

    const listOfRelatedContacts = [primaryContact, ...secondaryContacts];

    const emails = [
      ...new Set(
        listOfRelatedContacts
          .map((contact) => contact.email)
          .filter(Boolean) as string[],
      ),
    ];

    const phoneNumbers: number[] = [
      ...new Set(
        listOfRelatedContacts
          .map((contact) => contact.phoneNumber)
          .filter(Boolean) as number[],
      ),
    ];
    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContacts.map((contact) => contact.id),
      },
    };
    //
    // const contact = this.contactRepository.create({ email, phoneNumber });
    // return this.contactRepository.save(contact);
  }

  findAll(): Promise<Contact[]> {
    return this.contactRepository.find();
  }
}
