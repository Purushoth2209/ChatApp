import React, { useState, useEffect, useCallback } from 'react';
import { ListGroup, Form, Button, Modal, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import '../styles/chat/leftbar.css';
import ContactIcon from '../../Contact.png';
import LogoutIcon from '../../Logout.png';

const socket = io(process.env.REACT_APP_API_URL);

function LeftBar({
  searchQuery,
  setSearchQuery,
  setContactSearchResults,
  contactSearchResults,
  setCurrentContact,
  setMessagesByContact,
}) {
  const [newContactModal, setNewContactModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [error, setError] = useState('');
  const [contacts, setContactsState] = useState([]);
  const navigate = useNavigate();

  const fetchContacts = useCallback(async () => {
    try {
      const profileId = localStorage.getItem('profileId');
      if (!profileId) {
        console.error('Profile ID not found.');
        return;
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/fetchContact?profileId=${profileId}`
      );
      if (response.status === 200) {
        setContactsState(response.data.contacts);
        setContactSearchResults(response.data.contacts);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  }, [setContactSearchResults]);

  useEffect(() => {
    fetchContacts();
    socket.on('receiveMessage', (message) => {
      console.log('Message received:', message);

      // Update unread message count for the sender
      setContactsState((prevContacts) =>
        prevContacts.map((contact) => {
          if (contact.profileId === message.senderId) {
            return {
              ...contact,
              unreadMessages: (contact.unreadMessages || 0) + 1,
            };
          }
          return contact;
        })
      );
    });
    return () => {
      socket.off('receiveMessage');
    };
  }, [fetchContacts]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    searchContacts(e.target.value);
  };

  const searchContacts = (query) => {
    const filteredContacts = contacts.filter(
      (contact) =>
        contact.username.toLowerCase().includes(query.toLowerCase()) ||
        contact.phoneNumber.includes(query)
    );
    setContactSearchResults(filteredContacts);
  };

  const handleSelectContact = (contact) => {
    setCurrentContact(contact);

    // Reset unread messages count for the selected contact
    setContactsState((prevContacts) =>
      prevContacts.map((c) =>
        c.profileId === contact.profileId
          ? { ...c, unreadMessages: 0 }
          : c
      )
    );
  };

  const handleShowModal = () => {
    setNewContactModal(true);
  };

  const handleCloseModal = () => {
    setNewContactModal(false);
    setNewContactName('');
    setNewContactNumber('');
    setError('');
  };

  const handleCreateContact = async () => {
    const profileId = localStorage.getItem('profileId');
    if (!profileId) {
      setError('User not logged in.');
      return;
    }
    if (!newContactName || !newContactNumber) {
      setError('All fields are required.');
      return;
    }
    try {
      const searchResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/search?query=${newContactNumber}`
      );
      if (searchResponse.status === 200 && searchResponse.data.user) {
        const { profileId: contactProfileId } = searchResponse.data.user;
        const addContactResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/auth/addContact`,
          {
            profileId,
            contactName: newContactName,
            contactProfileId,
            contactPhoneNumber: newContactNumber,
          }
        );
        if (addContactResponse.status === 200) {
          handleCloseModal();
          fetchContacts();
        } else {
          setError(addContactResponse.data.message);
        }
      } else {
        setError('User not found.');
      }
    } catch (error) {
      setError('An error occurred while adding the contact.');
    }
  };

  const handleLogout = async () => {
    const profileId = localStorage.getItem('profileId');
    if (!profileId) return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      localStorage.clear();
      if (setMessagesByContact) setMessagesByContact({});
      setCurrentContact(null);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const showLogoutModal = () => {
    setLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setLogoutModal(false);
  };

  return (
    <div className="leftbar-container">
      <div className="header d-flex justify-content-between align-items-center">
        <div className="chats-title">
          <h4>Chats</h4>
        </div>
        <div className="action-icons">
          <img
            src={ContactIcon}
            alt="Add Contact"
            onClick={handleShowModal}
            className="icon add-contact-img"
          />
          <img
            src={LogoutIcon}
            alt="Logout"
            onClick={showLogoutModal}
            className="icon logout-img"
          />
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="Search contacts"
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-bar"
      />

      <ListGroup className="contacts-list">
        {contactSearchResults.length > 0 ? (
          contactSearchResults.map((contact) => (
            <ListGroup.Item
              key={contact.profileId}
              action
              onClick={() => handleSelectContact(contact)}
              className="d-flex justify-content-between align-items-center"
            >
              <div>
                <strong>{contact.username}</strong>
                <br />
                <small>{contact.phoneNumber}</small>
              </div>
              {contact.unreadMessages > 0 && (
                <Badge pill bg="danger">
                  {contact.unreadMessages}
                </Badge>
              )}
            </ListGroup.Item>
          ))
        ) : (
          <p className="text-muted text-center">No results found.</p>
        )}
      </ListGroup>

      {/* Add Contact Modal */}
      <Modal show={newContactModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Contact name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Phone number"
                value={newContactNumber}
                onChange={(e) => setNewContactNumber(e.target.value)}
              />
            </Form.Group>
            {error && <p className="text-danger">{error}</p>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleCreateContact}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal show={logoutModal} onHide={closeLogoutModal}>
        <Modal.Header closeButton>
          <Modal.Title>Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to logout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeLogoutModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default LeftBar;
