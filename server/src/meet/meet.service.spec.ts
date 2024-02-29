import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose, { Model, ObjectId } from 'mongoose';
import { mock } from 'node:test';
import { Appointment } from '../schemas/appointment.schema';
import { CreateMeetDto } from './dto/create-meet.dto';
import { NewAnswerDto } from './dto/new-answer.dto';
import { MeetService } from './meet.service';

describe('MeetService', () => {
  let meetService: MeetService;
  let model: Model<Appointment>;

  // Mock meet object
  const mockMeet = {
    _id: '65ddc1a883b51eea009aba04',
    appointmentId: 'ieihrA7',
    meetName: 'Test Meet',
    place: 'Test Place',
    link: 'Test Link',
    dates: [
      {
        date: 1700089200000,
        times: [1700118000000],
      },
    ],
    answers: [],
  };

  // Mock dependencies from services
  const mockAppointmentModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetService,
        {
          provide: getModelToken(Appointment.name),
          useValue: mockAppointmentModel,
        },
      ],
    }).compile();

    meetService = module.get<MeetService>(MeetService);
    model = module.get<Model<Appointment>>(getModelToken(Appointment.name));
  });

  describe('create', () => {
    it('should create a new meet', async () => {
      const newMeetDto: CreateMeetDto = {
        meetName: 'Test Meet',
        place: 'Test Place',
        link: 'Test Link',
        dates: [
          {
            date: 1700089200000,
            times: [
              1700118000000, 1700119800000, 1700121600000, 1700123400000,
              1700125200000, 1700127000000, 1700128800000, 1700130600000,
              1700132400000, 1700134200000, 1700136000000, 1700137800000,
            ],
          },
        ],
        answers: [],
      };
      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve(mockMeet as any));
      const result = await meetService.create(newMeetDto);
      expect(result).toEqual(mockMeet);
    });
  });

  describe('findAll', () => {
    it('should return an array of meets', async () => {
      // Mock the return value of the find method
      jest.spyOn(model, 'find').mockResolvedValueOnce([mockMeet]);

      const result = await meetService.findAll();

      expect(result).toEqual([mockMeet]);
    });

    it('should throw an error if no meets are found', async () => {
      jest.spyOn(model, 'find').mockResolvedValue([]);

      await expect(meetService.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it("should return a meet's details", async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockMeet);

      const result = await meetService.findOne(mockMeet.appointmentId);

      expect(result).toEqual(mockMeet);
    });

    it('should throw an error if the meet is not found', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

      await expect(meetService.findOne(mockMeet.appointmentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addAnswer', () => {
    const newAnswerDto: NewAnswerDto = {
      userId: null,
      username: 'Test User',
      dates: [
        {
          meetDate: 1700089200000,
          isOnline: true,
        },
        {
          meetDate: 1700089300000,
          isOnline: false,
        },
      ],
    };

    const updatedMeet = mockMeet;
    mockMeet.answers.push(newAnswerDto);

    it('should add a new answer to the meet', async () => {
      jest.spyOn(model, 'findOneAndUpdate').mockResolvedValueOnce(updatedMeet);

      const result = await meetService.addAnswer(
        mockMeet.appointmentId,
        newAnswerDto,
      );

      expect(result).toEqual(updatedMeet);
    });

    // it('should throw an error if dates are not valid', async () => {
    //   jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue(null);

    //   const invalidAnswerDto: NewAnswerDto = {
    //     userId: null,
    //     username: 'Test User',
    //     dates: [],
    //   };

    //   const result = meetService.addAnswer(
    //     mockMeet.appointmentId,
    //     invalidAnswerDto,
    //   );

    //   await expect(result).rejects.toThrow(BadRequestException);
    // });

    // it('should throw an error if the meet is not found', async () => {
    //   jest
    //     .spyOn(model, 'findOneAndUpdate')
    //     .mockResolvedValueOnce(NotFoundException);

    //   const result = meetService.addAnswer('wrongId', newAnswerDto);

    //   await expect(result).rejects.toBeInstanceOf(NotFoundException);
    // });
  });
});