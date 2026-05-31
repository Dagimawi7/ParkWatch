// shared rules and structures for all citites

// rules for what a single ticket look like 
export interface Ticket {
    ticketNumber: string; // ticket number 
    issueDate: string; // date the ticket was issued
    amountDue: number; // amount due
    description: string; // description of the ticket
    location?: string; // location of the ticket
    rawPayload: any; // raw data from the city website
}
// rules for the result of checking the ticket 
export interface EngineResult {
    success: boolean; // was the check successful
    tickets: Ticket[]; // list of tickets found
    error?: string; // error message if any
    screenshotpath?: string; // path to screenshot if any
}
// rules for how every city must look for parking tickets
export interface CityEngine {
  cityName: string; // name of the city
  checkTickets(plate: string): Promise<EngineResult>; // takes plate and works in the backgorund to check for tickets
}