import { Body, Controller, Get, Post } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDTO } from './dto/create-contact.dto';
import { Contact } from './contact.entity';

@Controller('identify')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async createContact(@Body() createContactDTO: CreateContactDTO) {
    return this.contactService.createContact(createContactDTO);
  }

  @Get()
  async getAllContacts(): Promise<Contact[]> {
    return this.contactService.findAll();
  }
}
