import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HistoryTransactionService } from './history-transaction.service';
import { CreateHistoryTransactionDto } from './dto/create-history-transaction.dto';
import { UpdateHistoryTransactionDto } from './dto/update-history-transaction.dto';

@Controller('history-transaction')
export class HistoryTransactionController {}
