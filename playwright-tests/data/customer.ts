/** Delivery details as the checkout form and POST /api/orders take them. */
export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
}

/** The test customer from the manual cases (the shopper under test). */
export const meera: Customer = {
  name: 'Meera Iyer',
  email: 'meera@example.com',
  phone: '9876543210',
  address: '14 Lake View Road, Indiranagar',
  city: 'Bengaluru',
  pin: '560038',
};

/** The second shopper, who buys through the API. */
export const kabir: Customer = {
  name: 'Kabir Mehta',
  email: 'kabir@example.com',
  phone: '9123456780',
  address: '22 Hill Road, Bandra',
  city: 'Mumbai',
  pin: '400050',
};
