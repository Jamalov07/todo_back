import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface WorkAttrs {
  user_id: number;
  title: string;
  status: boolean;
  expired_time: Date;
}

@Table({ tableName: 'works' })
export class Work extends Model<Work, WorkAttrs> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;
  @Column({ type: DataType.STRING, allowNull: false })
  title: string;
  @Column({ type: DataType.BOOLEAN })
  status: boolean;
  @Column({ type: DataType.DATE })
  expired_time: Date;
}
