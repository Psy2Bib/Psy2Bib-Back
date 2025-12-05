import { Test, TestingModule } from '@nestjs/testing';
import { VisioGateway } from './visio.gateway';

describe('VisioGateway', () => {
  let gateway: VisioGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VisioGateway],
    }).compile();

    gateway = module.get<VisioGateway>(VisioGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
